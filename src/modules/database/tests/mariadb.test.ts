import assert from "node:assert/strict";
import { test } from "node:test";
import {
  Kysely,
  DummyDriver,
  MysqlAdapter,
  MysqlQueryCompiler,
  MysqlIntrospector,
  sql,
} from "kysely";
import { createDatabaseProvider } from "../index.js";
import {
  mariaDbConfig,
  MariaDbCompatibilityPlugin,
} from "../drivers/mariadb/index.js";

test("MariaDB configuration fails without credentials and never falls back to SQLite", () => {
  assert.throws(
    () =>
      createDatabaseProvider({
        DB_DRIVER: "mariadb",
        DB_SQLITE_PATH: "old.sqlite",
      }),
    /Invalid MariaDB configuration/,
  );
  assert.throws(
    () =>
      mariaDbConfig({
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_USER: "root",
        DB_PASSWORD: "secret",
        DB_MASTER_NAME: "invalid;name",
      }),
    /DB_MASTER_NAME/,
  );
});

function compiler() {
  return new Kysely<{ records: { id: string; value: string } }>({
    dialect: {
      createAdapter: () => new MysqlAdapter(),
      createDriver: () => new DummyDriver(),
      createQueryCompiler: () => new MysqlQueryCompiler(),
      createIntrospector: (db) => new MysqlIntrospector(db),
    },
    plugins: [new MariaDbCompatibilityPlugin()],
  });
}

test("portable JSON aggregation translates arbitrary owner column names", () => {
  const db = compiler();
  const aggregate = sql`select json_group_array(item_code) from item_rows`.compile(db);
  assert.match(aggregate.sql, /coalesce\(json_arrayagg\(item_code\),json_array\(\)\)/);
});

test("MariaDB conflict translation keeps values bound and avoids INSERT IGNORE", () => {
  const db = compiler();
  const compiled = db
    .insertInto("records")
    .values({ id: "tenant", value: "a'; DROP TABLE records; --" })
    .onConflict((conflict) => conflict.column("id").doNothing())
    .compile();
  assert.match(compiled.sql, /on duplicate key update `id` = `id`/);
  assert.doesNotMatch(compiled.sql, /DROP TABLE|ignore|on conflict/i);
  assert.equal(compiled.parameters[1], "a'; DROP TABLE records; --");
  const update = db
    .insertInto("records")
    .values({ id: "tenant", value: "new" })
    .onConflict((conflict) =>
      conflict.column("id").doUpdateSet({ value: "new" }),
    )
    .compile();
  assert.match(update.sql, /on duplicate key update `value` = \?/);
});

test("MariaDB schema uses indexable strings and preserves unindexed text", () => {
  const db = compiler();
  const query = db.schema
    .createTable("records")
    .addColumn("id", "text", (column) => column.primaryKey())
    .addColumn("value", "text")
    .compile();
  assert.match(query.sql, /`id` varchar\(255\) primary key/);
  assert.match(query.sql, /`value` text/);
  const aggregate =
    sql`select json_group_array(permission_id) from example_role_permissions`.compile(
      db,
    );
  assert.match(
    aggregate.sql,
    /coalesce\(json_arrayagg\(permission_id\),json_array\(\)\)/,
  );
});
