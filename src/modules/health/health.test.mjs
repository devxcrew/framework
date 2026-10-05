import test from "node:test";
import assert from "node:assert/strict";
import { createHealthProvider } from "../../../dist/modules/health/health.provider.js";

test("health provider reports dependency checks without leaking exceptions", () => {
  let databaseReady = true;
  const health = createHealthProvider({
    runtime: () => true,
    database: () => databaseReady,
    cache: () => {
      throw new Error("private connection detail");
    },
  });
  assert.equal(health.isReady(), false);
  assert.deepEqual(health.snapshot(), {
    runtime: true,
    database: true,
    cache: false,
  });
  databaseReady = false;
  assert.equal(health.isReady(), false);
  assert.equal(health.snapshot().database, false);
});
