import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseProvider, type ConnectionTarget } from "../index.js";

test("leased pool capacity is bounded and never evicts an active connection", async () => {
  const directory = await mkdtemp(join(tmpdir(), "database-pool-"));
  const database = createDatabaseProvider({
    DB_DRIVER: "sqlite",
    DB_SQLITE_PATH: join(directory, "master.sqlite"),
    DB_POOL_CACHE_LIMIT: "1",
  });
  const target = (key: string): ConnectionTarget => ({
    key,
    driver: "sqlite",
    sqlitePath: join(directory, `${key}.sqlite`),
    databaseName: null,
    version: 1,
  });
  let release!: () => void;
  let started!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  try {
    const active = database.withConnection(target("one"), async () => {
      started();
      await hold;
    });
    await ready;
    await assert.rejects(
      database.withConnection(target("two"), async () => {}),
      /capacity reached/,
    );
    assert.equal(database.poolStats().leased, 1);
    release();
    await active;
    await database.withConnection(target("two"), async () => {});
    assert.equal(database.poolStats().pools, 1);
    const shutdown = database.withConnection(target("two"), async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    await shutdown;
    await database.close();
    await database.close();
    await assert.rejects(
      database.withConnection(target("one"), async () => {}),
      /closed/,
    );
  } finally {
    release();
    await database.close();
    await rm(directory, { recursive: true, force: true });
  }
});
