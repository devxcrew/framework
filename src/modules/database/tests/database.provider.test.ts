import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseProvider } from "../index.js";

test("named connection registry reuses its Kysely connection and closes once", async () => {
  const root = await mkdtemp(join(tmpdir(), "database-connections-"));
  const registry = createDatabaseProvider({
    DB_DRIVER: "sqlite",
    DB_SQLITE_PATH: join(root, "test.sqlite"),
  });
  try {
    assert.equal(
      await registry.execute((db) => Promise.resolve(db)),
      registry.database,
    );
    assert.equal(registry.connections()[0].state, "initialized");
    await registry.migrate();
    await registry.verify();
    assert.equal(registry.connections()[0].state, "verified");
    await registry.close();
    await registry.close();
    assert.equal(registry.connections()[0].state, "closed");
    assert.throws(
      () => registry.execute((db) => Promise.resolve(db)),
      /closed/,
    );
  } finally {
    await registry.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("MariaDB connection listing excludes passwords and does not connect", async () => {
  const registry = createDatabaseProvider({
    DB_DRIVER: "mariadb",
    DB_HOST: "unreachable.invalid",
    DB_PORT: "3306",
    DB_USER: "private-user",
    DB_PASSWORD: "private-password",
    DB_MASTER_NAME: "master_test",
  });
  try {
    const list = registry.connections();
    assert.equal(list[0].name, "master");
    assert.equal(list[0].state, "initialized");
    assert.doesNotMatch(JSON.stringify(list), /private-password|private-user/);
  } finally {
    await registry.close();
  }
});

test("provider execution and transactions use the master and preserve rollback", async () => {
  const root = await mkdtemp(join(tmpdir(), "database-execution-"));
  const provider = createDatabaseProvider({
    DB_DRIVER: "sqlite",
    DB_SQLITE_PATH: join(root, "test.sqlite"),
  });
  try {
    await provider.migrate();
    await provider.execute((db) =>
      db
        .insertInto("application_metadata")
        .values({ key: "committed", value: "yes" })
        .execute(),
    );
    await assert.rejects(
      provider.transaction(async (db) => {
        await db
          .insertInto("application_metadata")
          .values({ key: "rolled-back", value: "no" })
          .execute();
        throw new Error("rollback");
      }),
      /rollback/,
    );
    const rows = await provider.execute((db) =>
      db.selectFrom("application_metadata").select("key").execute(),
    );
    assert.deepEqual(
      rows.map((row) => ({ ...row })),
      [{ key: "committed" }],
    );
    await provider.close();
    assert.throws(
      () =>
        provider.execute((db) =>
          db.selectFrom("application_metadata").selectAll().execute(),
        ),
      /closed/,
    );
  } finally {
    await provider.close();
    await rm(root, { recursive: true, force: true });
  }
});
