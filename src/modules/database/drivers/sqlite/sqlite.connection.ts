import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { SqliteDialect, type SqliteDatabase } from "kysely";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function createSqliteDialect(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  return new SqliteDialect({
    database: async () => new NodeSqliteDatabase(path),
  });
}

export class NodeSqliteDatabase implements SqliteDatabase {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    this.database = new DatabaseSync(path);
    this.database.exec(
      "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;",
    );
  }

  prepare(query: string) {
    const statement = this.database.prepare(query);
    statement.setReadBigInts(true);
    return {
      reader: statement.columns().length > 0,
      all: (parameters: readonly unknown[]) =>
        statement.all(...bind(parameters)),
      run: (parameters: readonly unknown[]) =>
        statement.run(...bind(parameters)),
      iterate: (parameters: readonly unknown[]) =>
        statement.iterate(...bind(parameters)),
    };
  }

  close() {
    this.database.close();
  }
}

function bind(parameters: readonly unknown[]): SQLInputValue[] {
  return parameters.map((value) => {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "bigint" ||
      value instanceof Uint8Array
    )
      return value;
    throw new TypeError("Unsupported SQLite parameter type.");
  });
}
