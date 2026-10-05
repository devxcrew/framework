import { resolve } from "node:path";

export function sqliteConfig(environment: NodeJS.ProcessEnv) {
  const path =
    environment.DB_SQLITE_PATH ?? "storage/private/data/identity.sqlite";
  if (!path.trim()) throw new Error("DB_SQLITE_PATH must not be empty.");
  if (path === ":memory:" || path.startsWith("file:"))
    throw new Error("DB_SQLITE_PATH must identify a persisted SQLite file.");
  return { path: resolve(path) };
}
