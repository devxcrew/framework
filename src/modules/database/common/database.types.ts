import type { Generated, Kysely } from "kysely";
import type { Migration } from "kysely/migration";
export interface DatabaseInfrastructureSchema {
  transfer_checkpoints: {
    job_id: string;
    source_sha256: string;
    cursor: number;
    version: Generated<number>;
  };
  application_metadata: { key: string; value: string };
}
export type DatabaseSchema = DatabaseInfrastructureSchema;
export interface ConnectionTarget {
  key: string;
  driver: "sqlite" | "mariadb";
  databaseName: string | null;
  sqlitePath: string | null;
  version: number;
}
export interface DatabaseProviderOptions<Schema> {
  migrations?: Readonly<Record<string, Migration>>;
  seed?: (
    database: Kysely<Schema>,
    environment: NodeJS.ProcessEnv,
  ) => Promise<void>;
}
