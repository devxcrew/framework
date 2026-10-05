import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationServer } from "../../../dist/http/server.js";
import {
  createAsyncHealthProvider,
  createHealthProvider,
} from "../../../dist/modules/health/health.provider.js";

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

test("asynchronous health checks return false at a bounded deadline", async () => {
  const health = createAsyncHealthProvider(
    {
      runtime: async () => true,
      database: async () => new Promise(() => {}),
    },
    20,
  );
  assert.equal(await health.isReady(), false);
  assert.deepEqual(await health.snapshot(), { runtime: true, database: false });
});

test("HTTP readiness bounds an unresponsive asynchronous check", async (t) => {
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    readiness: () => new Promise(() => {}),
    readinessTimeoutMs: 20,
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/health/ready`,
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ready: false });
});
