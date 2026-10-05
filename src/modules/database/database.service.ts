import { access } from "node:fs/promises";
import { createDatabaseProvider } from "./database.provider.js";
import { readDatabaseConfiguration } from "./common/index.js";
import type {
  DatabaseInfrastructureSchema,
  DatabaseProviderOptions,
} from "./common/database.types.js";

/** Read-only engine readiness. Owner readiness is composed by the application. */
export async function smokeDatabase<
  Schema extends DatabaseInfrastructureSchema = DatabaseInfrastructureSchema,
>(
  environment: NodeJS.ProcessEnv = process.env,
  options: DatabaseProviderOptions<Schema> = {},
) {
  const configuration = readDatabaseConfiguration(environment);
  if (configuration.driver === "sqlite") await access(configuration.path);
  const provider = createDatabaseProvider(environment, options);
  try {
    const migrations = await provider.migrationStatus();
    if (migrations.some((migration) => !migration.executedAt))
      throw new Error(
        "Database has pending migrations; run the application's migration command.",
      );
    await provider.verify();
    return {
      driver: provider.driver,
      migrations: migrations.length,
      status: "ready",
    } as const;
  } finally {
    await provider.close();
  }
}
