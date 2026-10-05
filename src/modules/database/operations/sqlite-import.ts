import { DatabaseSync } from "node:sqlite";

import { sql, type Kysely } from "kysely";

export class SqliteDataTransfer {
  constructor(
    private readonly source: DatabaseSync,
    private readonly allowed: readonly string[],
  ) {}
  async execute<Schema>(target: Kysely<Schema>, signal?: AbortSignal) {
    if (
      this.source.prepare("PRAGMA integrity_check").get()?.integrity_check !==
      "ok"
    )
      throw new Error("SQLite integrity failed.");
    if (this.source.prepare("PRAGMA foreign_key_check").all().length)
      throw new Error("SQLite foreign keys failed.");
    this.source.exec("BEGIN");
    try {
      const existing = new Set(
        this.source
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all()
          .map((row) => String(row.name)),
      );
      const remaining = new Set(
        this.allowed.filter((name) => existing.has(name)),
      );
      const targetTables = new Set(
        (await target.introspection.getTables()).map((table) => table.name),
      );
      const ordered: string[] = [];
      while (remaining.size) {
        const ready = [...remaining].filter((table) => {
          assertIdentifier(table);
          return this.source
            .prepare(`PRAGMA foreign_key_list("${table}")`)
            .all()
            .every(
              (fk) => !remaining.has(String(fk.table)) || fk.table === table,
            );
        });
        if (!ready.length) throw new Error("Cyclic source table dependencies.");
        for (const table of ready) {
          if (!targetTables.has(table))
            throw new Error("Destination schema is incomplete.");
          remaining.delete(table);
          ordered.push(table);
        }
      }
      return await target.transaction().execute(async (transaction) => {
        const report: Record<string, number> = {};
        for (const table of ordered) {
          const primary = this.source
            .prepare(`PRAGMA table_info("${table}")`)
            .all()
            .filter((column) => Number(column.pk) > 0)
            .map((column) => String(column.name));
          if (!primary.length)
            throw new Error("Transfer tables require a primary key.");
          const statement = this.source.prepare(`SELECT * FROM "${table}"`);
          statement.setReadBigInts(true);
          let count = 0;
          for (const row of statement.iterate()) {
            signal?.throwIfAborted();
            const columns = Object.keys(row);
            columns.forEach(assertIdentifier);
            const values = columns.map((key) =>
              typeof row[key] === "bigint" ? String(row[key]) : row[key],
            );
            await sql`INSERT INTO ${sql.table(table)} (${sql.join(columns.map((column) => sql.ref(column)))}) VALUES (${sql.join(values.map((value) => sql`${value}`))})
 ON DUPLICATE KEY UPDATE ${sql.join(columns.map((column) => sql`${sql.ref(column)}=VALUES(${sql.ref(column)})`))}`.execute(
              transaction,
            );
            const found = await sql<
              Record<string, unknown>
            >`SELECT * FROM ${sql.table(table)} WHERE ${sql.join(
              primary.map(
                (key) =>
                  sql`${sql.ref(key)}=${typeof row[key] === "bigint" ? String(row[key]) : row[key]}`,
              ),
              sql` AND `,
            )}`.execute(transaction);
            if (
              found.rows.length !== 1 ||
              canonical(row) !== canonical(found.rows[0])
            )
              throw new Error(`Import verification failed for ${table}.`);
            count++;
          }
          const total = await sql<{
            total: string | number | bigint;
          }>`SELECT COUNT(*) AS total FROM ${sql.table(table)}`.execute(
            transaction,
          );
          if (BigInt(total.rows[0].total) !== BigInt(count))
            throw new Error(`Destination records differ for ${table}.`);
          report[table] = count;
        }
        signal?.throwIfAborted();
        return report;
      });
    } finally {
      this.source.exec("ROLLBACK");
    }
  }
}

function assertIdentifier(name: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name))
    throw new Error("Invalid transfer identifier.");
}
function canonical(row: Record<string, unknown>) {
  return JSON.stringify(
    Object.keys(row)
      .sort()
      .map((key) => [
        key,
        row[key] === null
          ? null
          : row[key] instanceof Uint8Array
            ? Buffer.from(row[key] as Uint8Array).toString("hex")
            : String(row[key]),
      ]),
  );
}
