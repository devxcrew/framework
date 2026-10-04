export interface ModuleProvider<T = unknown> {
  name: string;
  dependencies?: readonly string[];
  create(providers: ReadonlyMap<string, unknown>): T;
  start?(provider: T, signal: AbortSignal): void | Promise<void>;
  stop?(provider: T): void | Promise<void>;
}

export function composeModules(modules: readonly ModuleProvider<any>[], options: { startupTimeoutMs?: number; shutdownTimeoutMs?: number } = {}) {
  const startupTimeoutMs = options.startupTimeoutMs ?? 30_000;
  if (!Number.isSafeInteger(startupTimeoutMs) || startupTimeoutMs < 1) throw new Error("Invalid startup timeout.");
  const shutdownTimeoutMs = options.shutdownTimeoutMs ?? 30_000;
  if (!Number.isSafeInteger(shutdownTimeoutMs) || shutdownTimeoutMs < 1) throw new Error("Invalid shutdown timeout.");
  const pending = new Map(modules.map((module) => [module.name, module]));
  if (pending.size !== modules.length) throw new Error("Duplicate module name.");
  const providers = new Map<string, unknown>();
  const ordered: ModuleProvider<any>[] = [];
  while (pending.size) {
    const ready = [...pending.values()].find((module) =>
      (module.dependencies ?? []).every((name) => providers.has(name)),
    );
    if (!ready) throw new Error("Missing or cyclic module dependencies.");
    const dependencies = new Map((ready.dependencies ?? []).map((name) => [name, providers.get(name)]));
    providers.set(ready.name, ready.create(dependencies));
    ordered.push(ready);
    pending.delete(ready.name);
  }
  const started: ModuleProvider<any>[] = [];
  let state: "created" | "starting" | "ready" | "stopping" | "stopped" | "failed" = "created";
  let cleanupPromise: Promise<void> | undefined;
  async function cleanup() {
    state = "stopping";
    const failures: unknown[] = [];
    const deadline = Date.now() + shutdownTimeoutMs;
    for (const module of started.splice(0).reverse()) {
      try {
        const work = Promise.resolve(module.stop?.(providers.get(module.name)));
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          void work.catch(() => {});
          throw new Error(`Module shutdown deadline exceeded: ${module.name}`);
        }
        await withinDeadline(work, remaining, module.name);
      }
      catch (error) { failures.push(error); }
    }
    state = failures.length ? "failed" : "stopped";
    if (failures.length) throw new AggregateError(failures, "Module cleanup failed.");
  }
  return {
    get state() { return state; },
    get<T>(name: string): T {
      if (!providers.has(name)) throw new Error(`Unknown module: ${name}`);
      return providers.get(name) as T;
    },
    async start() {
      if (state !== "created") throw new Error("Modules can only start once.");
      state = "starting";
      const controller = new AbortController();
      const deadline = Date.now() + startupTimeoutMs;
      try {
        for (const module of ordered) {
          started.push(module);
          const remaining = deadline - Date.now();
          if (remaining <= 0) throw new Error(`Module startup deadline exceeded: ${module.name}`);
          await withinDeadline(Promise.resolve(module.start?.(providers.get(module.name), controller.signal)), remaining, module.name, "startup");
        }
        state = "ready";
      } catch (error) {
        controller.abort(error);
        try { cleanupPromise ??= cleanup(); await cleanupPromise; }
        catch (cleanup) { throw new AggregateError([error, cleanup], "Startup and cleanup failed."); }
        throw error;
      }
    },
    async stop() {
      if (state === "starting") throw new Error("Cannot stop modules during startup.");
      if (state === "stopped") return;
      cleanupPromise ??= cleanup();
      await cleanupPromise;
    },
  };
}

async function withinDeadline(work: Promise<void>, milliseconds: number, name: string, phase = "shutdown") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Module ${phase} deadline exceeded: ${name}`)), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
