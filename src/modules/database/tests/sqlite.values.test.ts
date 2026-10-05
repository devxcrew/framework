import assert from "node:assert/strict";
import { test } from "node:test";
import { NodeSqliteDatabase } from "../drivers/sqlite/index.js";

test("SQLite adapter preserves null, binary and signed 64-bit integer parameters", () => {
  const database = new NodeSqliteDatabase(":memory:");
  try {
    database.prepare("CREATE TABLE fixture(value INTEGER)").run([]);
    for (const value of [
      null,
      0,
      -1,
      1.25,
      9223372036854775807n,
      -9223372036854775808n,
      new Uint8Array([0, 1, 127, 255]),
      "தமிழ்",
    ]) {
      database.prepare("DELETE FROM fixture").run([]);
      database.prepare("INSERT INTO fixture VALUES(?)").run([value]);
      const result = database
        .prepare("SELECT value FROM fixture")
        .all([])[0].value;
      if (typeof value === "number" && Number.isInteger(value))
        assert.equal(result, BigInt(value));
      else assert.deepEqual(result, value);
    }
    for (const value of [undefined, true, {}, [], new Date()]) {
      assert.throws(
        () => database.prepare("INSERT INTO fixture VALUES(?)").run([value]),
        /Unsupported SQLite parameter/,
      );
    }
  } finally {
    database.close();
  }
});
