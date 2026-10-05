import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { z } from "zod";
import { DatabaseSync } from "node:sqlite";
import {
  createDatabaseProvider,
  DatabaseValidationError,
  smokeDatabase,
} from "../index.js";

const record = z.strictObject({ key: z.string().min(1), value: z.string() });

class DatabaseFixture {
  private constructor(
    readonly directory: string,
    readonly environment: NodeJS.ProcessEnv,
    readonly provider: ReturnType<typeof createDatabaseProvider>,
  ) {}
  static async open() {
    const directory = await mkdtemp(join(tmpdir(), "database-data-suite-"));
    const environment = {
      DB_DRIVER: "sqlite",
      DB_SQLITE_PATH: join(directory, "master.sqlite"),
    };
    const fixture = new DatabaseFixture(
      directory,
      environment,
      createDatabaseProvider(environment),
    );
    await fixture.provider.migrate();
    return fixture;
  }
  async close() {
    await this.provider.close();
    await rm(this.directory, { recursive: true, force: true });
  }
}

test("validated persistence preserves Unicode, null characters, SQL literals and durable data", async () => {
  const fixture = await DatabaseFixture.open();
  try {
    for (const value of [
      "",
      "தமிழ் 🚀",
      "line\nnext\u0000end",
      "'); DROP TABLE application_metadata; --",
      "x".repeat(100_000),
    ]) {
      await fixture.provider.masterData.persist(
        record,
        { key: "value", value },
        (db, row) =>
          db
            .insertInto("application_metadata")
            .values(row)
            .onConflict((c) => c.column("key").doUpdateSet(row))
            .execute(),
      );
      const rows = await fixture.provider.masterData.fetch(
        { page: 1, pageSize: 1 },
        (db, page) =>
          db
            .selectFrom("application_metadata")
            .selectAll()
            .orderBy("key")
            .limit(page.limit)
            .offset(page.offset)
            .execute(),
        record,
      );
      assert.equal(rows.data[0].value, value);
    }
    await fixture.provider.close();
    const reopened = createDatabaseProvider(fixture.environment);
    try {
      assert.equal(
        (
          await reopened.database
            .selectFrom("application_metadata")
            .selectAll()
            .execute()
        )[0].value.length,
        100_000,
      );
    } finally {
      await reopened.close();
    }
  } finally {
    await fixture.close();
  }
});

for (const input of [
  null,
  {},
  { key: "", value: "x" },
  { key: "x", value: 2 },
  { key: "x", value: "x", private: "secret" },
]) {
  test(`server validation prevents writes for ${JSON.stringify(input)}`, async () => {
    const fixture = await DatabaseFixture.open();
    try {
      let called = false;
      await assert.rejects(
        fixture.provider.masterData.persist(record, input, async () => {
          called = true;
          return [];
        }),
        DatabaseValidationError,
      );
      assert.equal(called, false);
    } finally {
      await fixture.close();
    }
  });
}

for (const input of [
  { page: 0, pageSize: 10 },
  { page: 1, pageSize: 501 },
  { page: 1.5, pageSize: 10 },
  { page: 1, pageSize: 0 },
  { page: 1, pageSize: 10, sort: "raw" },
]) {
  test(`fetch rejects invalid pagination ${JSON.stringify(input)}`, async () => {
    const fixture = await DatabaseFixture.open();
    try {
      let called = false;
      await assert.rejects(
        fixture.provider.masterData.fetch(
          input,
          async () => {
            called = true;
            return [];
          },
          record,
        ),
        DatabaseValidationError,
      );
      assert.equal(called, false);
    } finally {
      await fixture.close();
    }
  });
}

test("streamed transfer bounds batches and commits 10000 rows; empty source writes nothing", async () => {
  const fixture = await DatabaseFixture.open();
  try {
    async function* source() {
      for (let i = 0; i < 10_000; i++)
        yield { key: `row-${String(i).padStart(5, "0")}`, value: String(i) };
    }
    let max = 0;
    const count = await fixture.provider.masterData.transfer(
      record,
      source(),
      async (db, rows) => {
        max = Math.max(max, rows.length);
        await db
          .insertInto("application_metadata")
          .values([...rows])
          .execute();
      },
      37,
    );
    assert.equal(count, 10_000);
    assert.equal(max, 37);
    const page = await fixture.provider.masterData.fetch(
      { page: 3, pageSize: 37 },
      (db, p) =>
        db
          .selectFrom("application_metadata")
          .selectAll()
          .orderBy("key")
          .limit(p.limit)
          .offset(p.offset)
          .execute(),
      record,
    );
    assert.equal(page.data[0].key, "row-00074");
    assert.equal(
      await fixture.provider.masterData.transfer(record, [], async () => {
        throw new Error("empty writes");
      }),
      0,
    );
  } finally {
    await fixture.close();
  }
});

for (const failure of ["validation", "duplicate", "source", "writer"]) {
  test(`transfer rolls back earlier batches on late ${failure} failure`, async () => {
    const fixture = await DatabaseFixture.open();
    try {
      async function* source() {
        yield { key: "first", value: "ok" };
        if (failure === "source") throw new Error("source failed");
        yield failure === "validation"
          ? { key: "bad", value: null }
          : { key: failure === "duplicate" ? "first" : "second", value: "ok" };
      }
      await assert.rejects(
        fixture.provider.masterData.transfer(
          record,
          source(),
          async (db, rows) => {
            if (failure === "writer" && rows[0].key === "second")
              throw new Error("writer failed");
            await db
              .insertInto("application_metadata")
              .values([...rows])
              .execute();
          },
          1,
        ),
      );
      assert.deepEqual(
        await fixture.provider.database
          .selectFrom("application_metadata")
          .selectAll()
          .execute(),
        [],
      );
    } finally {
      await fixture.close();
    }
  });
}

test("smoke is read-only, rejects pending migrations and leaves data intact", async () => {
  const fixture = await DatabaseFixture.open();
  try {
    await fixture.provider.database
      .insertInto("application_metadata")
      .values({ key: "sentinel", value: "unchanged" })
      .execute();
    assert.equal((await smokeDatabase(fixture.environment)).status, "ready");
    assert.equal(
      (
        await fixture.provider.database
          .selectFrom("application_metadata")
          .selectAll()
          .execute()
      )[0].value,
      "unchanged",
    );
    new DatabaseSync(join(fixture.directory, "empty.sqlite")).close();
    await assert.rejects(
      smokeDatabase({
        ...fixture.environment,
        DB_SQLITE_PATH: join(fixture.directory, "empty.sqlite"),
      }),
      /pending migrations/,
    );
    for (const batch of [0, 501, 1.2, NaN])
      await assert.rejects(
        fixture.provider.masterData.transfer(record, [], async () => {}, batch),
        DatabaseValidationError,
      );
  } finally {
    await fixture.close();
  }
});

for (const failure of ["abort", "deadline", "row-limit"]) {
  test(`transfer ${failure} rolls back and releases the connection`, async () => {
    const fixture = await DatabaseFixture.open();
    const abort = new AbortController();
    try {
      async function* source() {
        yield { key: "first", value: "ok" };
        if (failure === "abort") abort.abort(new Error("cancelled"));
        if (failure === "deadline")
          await new Promise((resolve) => setTimeout(resolve, 40));
        yield { key: "second", value: "ok" };
      }
      await assert.rejects(
        fixture.provider.masterData.transfer(
          record,
          source(),
          async (db, rows) => {
            await db
              .insertInto("application_metadata")
              .values([...rows])
              .execute();
          },
          1,
          {
            signal: abort.signal,
            timeoutMs: failure === "deadline" ? 10 : 1000,
            maxRows: failure === "row-limit" ? 1 : 100,
          },
        ),
      );
      assert.deepEqual(
        await fixture.provider.database
          .selectFrom("application_metadata")
          .selectAll()
          .execute(),
        [],
      );
    } finally {
      await fixture.close();
    }
  });
}
test("fetch rejects a repository that ignores the page bound or returns invalid DTOs", async () => {
  const fixture = await DatabaseFixture.open();
  try {
    await assert.rejects(
      fixture.provider.masterData.fetch(
        { page: 1, pageSize: 1 },
        async () => [
          { key: "a", value: "a" },
          { key: "b", value: "b" },
        ],
        record,
      ),
      /exceeded/,
    );
    await assert.rejects(
      fixture.provider.masterData.fetch(
        { page: 1, pageSize: 1 },
        async () => [{ key: "a", value: "a", secret: "hidden" }],
        record,
      ),
      /validation/,
    );
  } finally {
    await fixture.close();
  }
});
