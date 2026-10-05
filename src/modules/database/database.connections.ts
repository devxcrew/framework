import { ensureMariaDbDatabase } from "./drivers/mariadb/index.js";
import { createStorageMigrator } from "./database.migration.js";
import { Kysely, sql } from "kysely";
import { z } from "zod";
import {
  readDatabaseConfiguration,
  connectionTargetSchema,
  type ConnectionTarget,
  type DatabaseSchema,
} from "./common/index.js";
import { createSqliteDialect } from "./drivers/sqlite/index.js";
import {
  createMariaDbDialect,
  MariaDbCompatibilityPlugin,
} from "./drivers/mariadb/index.js";

type Pool = {
  target: ConnectionTarget;
  database: Kysely<DatabaseSchema>;
  leases: number;
  touched: number;
  retired: boolean;
  drained?: () => void;
};
export class DatabaseCapacityError extends Error {
  constructor() {
    super("Database connection capacity reached; retry later.");
  }
}

export class DatabaseConnections {
  private readonly environment: NodeJS.ProcessEnv;
  private readonly configuration;
  private readonly limit: number;
  private readonly idleMs: number;
  private master?: Kysely<DatabaseSchema>;
  private readonly pools = new Set<Pool>();
  private verified = false;
  private closed = false;
  private closing?: Promise<void>;
  // Serialize acquisition/retirement so concurrent requests cannot exceed the pool bound.
  private mutation: Promise<void> = Promise.resolve();
  constructor(environment: NodeJS.ProcessEnv = process.env) {
    this.environment = { ...environment };
    this.configuration = readDatabaseConfiguration(this.environment);
    this.limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .parse(environment.DB_POOL_CACHE_LIMIT ?? 16);
    this.idleMs = z.coerce
      .number()
      .int()
      .min(0)
      .max(86_400_000)
      .parse(environment.DB_POOL_IDLE_MS ?? 300_000);
  }
  get driver() {
    return this.configuration.driver;
  }
  getMaster() {
    if (this.closed) throw new Error("Database connections are closed.");
    if (!this.master) {
      const config = this.configuration;
      this.master = new Kysely<DatabaseSchema>({
        dialect:
          config.driver === "mariadb"
            ? createMariaDbDialect(this.environment)
            : createSqliteDialect(config.path),
        plugins:
          config.driver === "mariadb" ? [new MariaDbCompatibilityPlugin()] : [],
      });
    }
    return this.master;
  }
  async withConnection<T>(
    input: ConnectionTarget,
    work: (database: Kysely<DatabaseSchema>) => Promise<T>,
  ): Promise<T> {
    const target = connectionTargetSchema.parse(input);
    const entry = await this.exclusive(() => this.acquire(target));
    try {
      return await work(entry.database);
    } finally {
      await this.exclusive(async () => {
        entry.leases--;
        entry.touched = Date.now();
        if (entry.leases === 0) {
          entry.drained?.();
          if (entry.retired && !this.closed) await this.remove(entry);
        }
      });
    }
  }
  async provision(input: ConnectionTarget) {
    const target = connectionTargetSchema.parse(input);
    if (target.driver === "mariadb")
      await ensureMariaDbDatabase(this.environment, target.databaseName!);
    return this.withConnection(target, async (database) => {
      const result = await createStorageMigrator(database).migrateToLatest();
      if (result.error) throw result.error;
      return result.results ?? [];
    });
  }

  async verify() {
    this.verified = false;
    await sql`SELECT 1`.execute(this.getMaster());
    this.verified = true;
  }
  list() {
    const config = this.configuration;
    return [
      {
        name: "master",
        driver: config.driver,
        ...(config.driver === "mariadb"
          ? {
              host: config.options.host,
              port: config.options.port,
              database: config.options.database,
            }
          : { path: config.path }),
        state: this.closed
          ? "closed"
          : this.verified
            ? "verified"
            : this.master
              ? "initialized"
              : "configured",
      },
    ];
  }
  poolStats() {
    return {
      capacity: this.limit,
      pools: this.pools.size,
      leased: [...this.pools].reduce((sum, pool) => sum + pool.leases, 0),
    };
  }
  async close() {
    if (!this.closing) {
      this.closed = true;
      this.verified = false;
      this.closing = this.exclusive(async () => {
        // Capture entries without waiting inside the mutation lock: releases must still run.
        return [...this.pools];
      }).then(async (entries) => {
        await Promise.all(
          entries.map(async (entry) => {
            if (entry.leases)
              await new Promise<void>((resolve) => {
                entry.drained = resolve;
              });
            await entry.database.destroy();
          }),
        );
        this.pools.clear();
        await this.master?.destroy();
      });
    }
    await this.closing;
  }
  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    const result = this.mutation.then(work);
    this.mutation = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  private async acquire(target: ConnectionTarget) {
    if (this.closed) throw new Error("Database connections are closed.");
    const now = Date.now();
    for (const pool of [...this.pools]) {
      if (
        pool.target.key === target.key &&
        JSON.stringify(pool.target) !== JSON.stringify(target)
      )
        pool.retired = true;
      if (
        pool.leases === 0 &&
        (pool.retired || now - pool.touched >= this.idleMs)
      )
        await this.remove(pool);
    }
    const existing = [...this.pools].find(
      (pool) =>
        !pool.retired && JSON.stringify(pool.target) === JSON.stringify(target),
    );
    if (existing) {
      existing.leases++;
      return existing;
    }
    if (this.pools.size >= this.limit) {
      const idle = [...this.pools]
        .filter((pool) => pool.leases === 0)
        .sort((a, b) => a.touched - b.touched)[0];
      if (!idle) throw new DatabaseCapacityError();
      await this.remove(idle);
    }
    const database = new Kysely<DatabaseSchema>({
      dialect:
        target.driver === "mariadb"
          ? createMariaDbDialect({
              ...this.environment,
              DB_MASTER_NAME: target.databaseName!,
            })
          : createSqliteDialect(target.sqlitePath!),
      plugins:
        target.driver === "mariadb" ? [new MariaDbCompatibilityPlugin()] : [],
    });
    const entry: Pool = {
      target,
      database,
      leases: 1,
      touched: now,
      retired: false,
    };
    this.pools.add(entry);
    return entry;
  }
  private async remove(pool: Pool) {
    await pool.database.destroy();
    this.pools.delete(pool);
  }
}
