import type { Kysely } from "kysely";
import { DatabaseConnections } from "./database.connections.js";
import { DatabaseExecution } from "./database.execution.js";
import { ResumableTransfer } from "./database.transfer.js";
import {
  createDatabaseMigrator,
  prepareMigrationStorage,
} from "./database.migration.js";
import { seedDatabase } from "./database.seed.js";
import type {
  ConnectionTarget,
  DatabaseInfrastructureSchema,
  DatabaseProviderOptions,
} from "./common/database.types.js";

export function createDatabaseProvider<
  Schema extends DatabaseInfrastructureSchema = DatabaseInfrastructureSchema,
>(
  environment: NodeJS.ProcessEnv = process.env,
  options: DatabaseProviderOptions<Schema> = {},
) {
  const registry = new DatabaseConnections(environment);
  // Drivers know infrastructure tables; the caller supplies its owner schema and migrations.
  const database = registry.getMaster() as unknown as Kysely<Schema>;
  const migrator = createDatabaseMigrator(database, options.migrations);
  return {
    database,
    driver: registry.driver,
    masterData: new DatabaseExecution(database),
    masterTransfers: new ResumableTransfer(database),
    withConnection: <T>(
      target: ConnectionTarget,
      work: (database: Kysely<Schema>) => Promise<T>,
    ) =>
      registry.withConnection(target, (connection) =>
        work(connection as unknown as Kysely<Schema>),
      ),
    provisionConnection: (target: ConnectionTarget) =>
      registry.provision(target),
    poolStats: () => registry.poolStats(),
    verify: () => registry.verify(),
    connections: () => registry.list(),
    execute: <T>(work: (connection: Kysely<Schema>) => Promise<T>) =>
      work(registry.getMaster() as unknown as Kysely<Schema>),
    transaction: <T>(work: (connection: Kysely<Schema>) => Promise<T>) =>
      (registry.getMaster() as unknown as Kysely<Schema>)
        .transaction()
        .execute(work),
    migrationStatus: () => migrator.getMigrations(),
    async migrate() {
      await prepareMigrationStorage(database, registry.driver);
      const result = await migrator.migrateToLatest();
      if (result.error) throw result.error;
      return result.results ?? [];
    },
    async seed() {
      await seedDatabase(
        database as unknown as Kysely<DatabaseInfrastructureSchema>,
        environment.APP_NAME ?? "Application",
      );
      await options.seed?.(database, environment);
    },
    close: () => registry.close(),
  };
}
export type DatabaseProvider<
  Schema extends DatabaseInfrastructureSchema = DatabaseInfrastructureSchema,
> = ReturnType<typeof createDatabaseProvider<Schema>>;
