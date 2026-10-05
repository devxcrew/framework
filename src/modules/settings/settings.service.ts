import { readFileSync } from "node:fs";
import { readFile, rename, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import type { SettingsOptions } from "./settings.types.js";

export class SettingsService {
  private snapshot: Readonly<NodeJS.ProcessEnv>;
  private readonly writable: ReadonlySet<string>;
  private writes: Promise<void> = Promise.resolve();
  constructor(private readonly options: SettingsOptions) {
    this.snapshot = Object.freeze({ ...options.defaults });
    this.writable = new Set(options.writableKeys ?? []);
  }
  current() {
    return this.snapshot;
  }
  load(root = process.cwd(), overrides: NodeJS.ProcessEnv = process.env) {
    let file: NodeJS.ProcessEnv = {};
    try {
      file = parseEnv(readFileSync(resolve(root, ".env"), "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const environment = { ...this.options.defaults, ...file, ...overrides };
    this.validate(environment);
    // The provider never changes process.env or another application's snapshot.
    this.snapshot = Object.freeze(environment);
    return this.snapshot;
  }
  write(root: string, patch: Readonly<NodeJS.ProcessEnv>) {
    if (
      Object.entries(patch).some(
        ([key, value]) =>
          !this.writable.has(key) ||
          value === undefined ||
          /[\r\n\0]/.test(value),
      )
    )
      return Promise.reject(
        new Error("The settings update contains unsupported values."),
      );
    this.validate(patch);
    const result = this.writes.then(() => this.persist(root, patch));
    this.writes = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  private validate(environment: Readonly<NodeJS.ProcessEnv>) {
    if (
      this.options.schema &&
      !this.options.schema.safeParse(environment).success
    )
      throw new Error("Invalid application settings environment.");
  }
  private async persist(root: string, patch: Readonly<NodeJS.ProcessEnv>) {
    const path = resolve(root, ".env");
    let source = "";
    try {
      source = await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const written = new Set<string>();
    const lines = source.split(/\r?\n/).map((line) => {
      const key = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/.exec(line)?.[1];
      if (!key || !Object.hasOwn(patch, key)) return line;
      if (written.has(key)) return "";
      written.add(key);
      return `${key}=${encodeValue(patch[key]!)}`;
    });
    for (const [key, value] of Object.entries(patch))
      if (!written.has(key)) lines.push(`${key}=${encodeValue(value!)}`);
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${lines.join("\n").replace(/\n+$/, "")}\n`, {
        mode: 0o600,
        flag: "wx",
      });
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}
function encodeValue(value: string) {
  // Node's .env parser preserves backslashes literally; choose a quote it can read.
  if (!/[\s#"'`]/.test(value)) return value;
  const quote = ['"', "'"].find((candidate) => !value.includes(candidate));
  if (!quote)
    throw new Error(
      "The settings value cannot be represented in an environment file.",
    );
  return `${quote}${value}${quote}`;
}
