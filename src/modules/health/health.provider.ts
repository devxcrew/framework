export type HealthCheck = () => boolean;
export type HealthSnapshot = Readonly<Record<string, boolean>>;
export type AsyncHealthCheck = () => boolean | Promise<boolean>;

export interface HealthProvider {
  isReady(): boolean;
  snapshot(): HealthSnapshot;
}

export interface AsyncHealthProvider {
  isReady(): Promise<boolean>;
  snapshot(): Promise<HealthSnapshot>;
}

export function createHealthProvider(
  checks: Readonly<Record<string, HealthCheck>>,
): HealthProvider {
  const entries = Object.entries(checks);
  if (
    entries.some(([name, check]) => !name.trim() || typeof check !== "function")
  ) {
    throw new Error("Health checks require a name and function.");
  }
  return {
    isReady() {
      return entries.every(([, check]) => runCheck(check));
    },
    snapshot() {
      return Object.fromEntries(
        entries.map(([name, check]) => [name, runCheck(check)]),
      );
    },
  };
}

export function createAsyncHealthProvider(
  checks: Readonly<Record<string, AsyncHealthCheck>>,
  timeoutMs = 2_000,
): AsyncHealthProvider {
  const entries = Object.entries(checks);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1)
    throw new Error("Invalid health timeout.");
  if (
    entries.some(([name, check]) => !name.trim() || typeof check !== "function")
  )
    throw new Error("Health checks require a name and function.");
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        entries.map(
          async ([name, check]) =>
            [name, await runAsyncCheck(check, timeoutMs)] as const,
        ),
      ),
    );
  return {
    snapshot,
    async isReady() {
      return Object.values(await snapshot()).every(Boolean);
    },
  };
}

async function runAsyncCheck(check: AsyncHealthCheck, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(check),
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function runCheck(check: HealthCheck) {
  try {
    return check();
  } catch {
    return false;
  }
}
