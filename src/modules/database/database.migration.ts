import { sql, type Kysely } from "kysely";
import { type Migration, Migrator } from "kysely/migration";
export const transferCheckpointsMigration: Migration = {
  async up(database) {
    await database.schema
      .createTable("transfer_checkpoints")
      .addColumn("job_id", "text", (column) => column.primaryKey())
      .addColumn("source_sha256", "text", (column) => column.notNull())
      .addColumn("cursor", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("version", "integer", (column) =>
        column.notNull().defaultTo(1),
      )
      .execute();
  },
  async down(database) {
    await database.schema.dropTable("transfer_checkpoints").execute();
  },
};

export const databaseMetadataMigration: Migration = {
  async up(database) {
    await database.schema
      .createTable("application_metadata")
      .addColumn("key", "text", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .execute();
  },
  async down(database) {
    await database.schema.dropTable("application_metadata").execute();
  },
};

export function createDatabaseMigrator<Schema>(
  database: Kysely<Schema>,
  migrations: Readonly<Record<string, Migration>> = storageMigrations,
) {
  return new Migrator({
    db: database,
    migrationTableName: "migrations",
    migrationLockTableName: "migration_locks",
    provider: {
      async getMigrations() {
        return { ...migrations };
      },
    },
  });
}

export async function prepareMigrationStorage<Schema>(
  database: Kysely<Schema>,
  driver: string,
) {
  const tables = new Set(
    (
      await database.introspection.getTables({ withInternalKyselyTables: true })
    ).map((table) => table.name),
  );
  for (const [previous, current] of [
    ["kysely_migration", "migrations"],
    ["kysely_migration_lock", "migration_locks"],
  ]) {
    if (!tables.has(previous)) continue;
    if (tables.has(current)) {
      const rows = await sql<
        Record<string, unknown>
      >`SELECT * FROM ${sql.table(current)}`.execute(database);
      if (
        current === "migrations"
          ? rows.rows.length > 0
          : rows.rows.some((row) => Number(row.is_locked) !== 0)
      ) {
        throw new Error(
          `Both ${previous} and ${current} exist; migration history needs reconciliation.`,
        );
      }
      await database.schema.dropTable(current).execute();
    }
    await database.schema.alterTable(previous).renameTo(current).execute();
    tables.add(current);
  }
  if (driver !== "mariadb" || !tables.has("migrations")) return;
  const column = await sql<{
    DATA_TYPE: string;
  }>`SELECT DATA_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='migrations' AND COLUMN_NAME='timestamp'`.execute(
    database,
  );
  if (column.rows[0]?.DATA_TYPE === "datetime") return;
  const invalid = await sql<{
    total: number;
  }>`SELECT COUNT(*) total FROM migrations
    WHERE timestamp NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?Z?$'`.execute(
    database,
  );
  if (Number(invalid.rows[0]?.total))
    throw new Error("Migration timestamps contain unsupported values.");
  await sql`UPDATE migrations SET timestamp=REPLACE(REPLACE(timestamp,'T',' '),'Z','')`.execute(
    database,
  );
  await sql`ALTER TABLE migrations MODIFY COLUMN timestamp DATETIME(3) NOT NULL`.execute(
    database,
  );
}

export const storageMigrations = {
  "001_database_metadata": databaseMetadataMigration,
  "002_transfer_checkpoints": transferCheckpointsMigration,
};
export function createStorageMigrator<Schema>(database: Kysely<Schema>) {
  return createDatabaseMigrator(database, storageMigrations);
}
