import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createDatabaseProvider } from "../index.js";

test("resumable chunks preserve committed checkpoints, resume once and reject changed sources", async () => {
  const root = await mkdtemp(join(tmpdir(), "resumable-transfer-"));
  const database = createDatabaseProvider({
    DB_DRIVER: "sqlite",
    DB_SQLITE_PATH: join(root, "master.sqlite"),
  });
  const job = { jobId: "test", sourceSha256: "a".repeat(64), batchSize: 2 };
  const schema = z.strictObject({ key: z.string(), value: z.string() });
  try {
    await database.migrate();
    function* source(cursor: number) {
      for (let i = cursor; i < 7; i++)
        yield { key: String(i), value: String(i) };
    }
    await assert.rejects(
      database.masterTransfers.run(job, schema, source, async (db, rows) => {
        if (rows[0].key === "2") throw new Error("interrupted");
        await db
          .insertInto("application_metadata")
          .values([...rows])
          .execute();
      }),
      /interrupted/,
    );
    assert.equal(
      (
        await database.database
          .selectFrom("transfer_checkpoints")
          .selectAll()
          .executeTakeFirstOrThrow()
      ).cursor,
      2n,
    );
    const resumed = await database.masterTransfers.run(
      job,
      schema,
      source,
      async (db, rows) => {
        await db
          .insertInto("application_metadata")
          .values([...rows])
          .execute();
      },
    );
    assert.equal(resumed.cursor, 7);
    assert.equal(resumed.committed, 5);
    assert.equal(
      (
        await database.database
          .selectFrom("application_metadata")
          .selectAll()
          .execute()
      ).length,
      7,
    );
    assert.equal(
      (
        await database.masterTransfers.run(job, schema, source, async () => {
          throw new Error("duplicate write");
        })
      ).committed,
      0,
    );
    await assert.rejects(
      database.masterTransfers.run(
        { ...job, sourceSha256: "b".repeat(64) },
        schema,
        source,
        async () => {},
      ),
      /fingerprint changed/,
    );
  } finally {
    await database.close();
    await rm(root, { recursive: true, force: true });
  }
});
