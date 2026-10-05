import test from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import {
  composeModules,
  createApplicationServer,
  createLogger,
  createModuleToken,
  defineModuleProvider,
  parseListQuery,
  readJsonBody,
} from "../dist/index.js";

test("startup deadline aborts the unresponsive owner and rolls back acquired resources", async () => {
  const stopped = [];
  let signal;
  const runtime = composeModules(
    [
      {
        name: "ready",
        create: () => ({}),
        stop() {
          stopped.push("ready");
        },
      },
      {
        name: "hung",
        dependencies: ["ready"],
        create: () => ({}),
        start(_provider, cancellation) {
          signal = cancellation;
          return new Promise(() => {});
        },
        stop() {
          stopped.push("hung");
        },
      },
      {
        name: "later",
        dependencies: ["hung"],
        create: () => ({}),
        start() {
          assert.fail("Cannot start after expired startup budget");
        },
      },
    ],
    { startupTimeoutMs: 30 },
  );
  await assert.rejects(
    runtime.start(),
    /Module startup deadline exceeded: hung/,
  );
  assert.equal(signal.aborted, true);
  assert.deepEqual(stopped, ["hung", "ready"]);
  assert.equal(runtime.state, "stopped");
  assert.throws(
    () => composeModules([], { startupTimeoutMs: 0 }),
    /Invalid startup timeout/,
  );
});

test("module ordering, failed startup cleanup and invalid dependency graphs", async () => {
  const calls = [];
  const runtime = composeModules([
    {
      name: "consumer",
      dependencies: ["dependency"],
      create: (providers) => providers.get("dependency"),
      start() {
        calls.push("start consumer");
        throw new Error("failure");
      },
      stop() {
        calls.push("stop consumer");
      },
    },
    {
      name: "dependency",
      create: () => 42,
      start() {
        calls.push("start dependency");
      },
      stop() {
        calls.push("stop dependency");
      },
    },
  ]);
  assert.equal(runtime.get("consumer"), 42);
  await assert.rejects(runtime.start(), /failure/);
  assert.equal(runtime.state, "stopped");
  assert.deepEqual(calls, [
    "start dependency",
    "start consumer",
    "stop consumer",
    "stop dependency",
  ]);
  assert.throws(
    () => composeModules([{ name: "a", dependencies: ["b"], create() {} }]),
    /Missing or cyclic/,
  );
  assert.throws(
    () =>
      composeModules([
        { name: "a", create() {} },
        { name: "a", create() {} },
      ]),
    /Duplicate/,
  );
});

test("typed module contracts reject a different token with the same name", async () => {
  const baseToken = createModuleToken("base");
  const consumerToken = createModuleToken("consumer");
  const base = defineModuleProvider({
    token: baseToken,
    dependencies: [],
    create: () => ({ value: 7 }),
  });
  const consumer = defineModuleProvider({
    token: consumerToken,
    dependencies: [baseToken],
    create: (dependency) => ({ value: dependency.value + 1 }),
  });
  const runtime = composeModules([consumer, base]);
  assert.deepEqual(runtime.get(consumerToken), { value: 8 });
  assert.throws(
    () => runtime.get(createModuleToken("consumer")),
    /contract mismatch/,
  );
  await runtime.start();
  await runtime.stop();
  assert.throws(
    () =>
      composeModules([consumer, { ...base, token: createModuleToken("base") }]),
    /contract mismatch/,
  );
});

test("request diagnostics include the request ID without query secrets", async (t) => {
  const logs = [];
  const events = [];
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    logger: createLogger({ sink: (record) => logs.push(record) }),
    onRequestComplete: (event) => events.push(event),
    apiHandler(_request, response) {
      response.writeHead(200);
      response.end("ok");
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/status?token=private`,
  );
  assert.equal(response.status, 200);
  await response.text();
  assert.equal(events.length, 1);
  assert.equal(events[0].requestId, response.headers.get("x-request-id"));
  assert.equal(events[0].path, "/api/status");
  assert.equal(logs[0].requestId, events[0].requestId);
  assert.doesNotMatch(JSON.stringify(logs), /private/);
});

test("unresponsive API handler has a bounded safe response and cancellation", async (t) => {
  let signal;
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    handlerTimeoutMs: 30,
    apiHandler: async (_request, _response, context) => {
      signal = context.signal;
      await new Promise(() => {});
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/hung`,
    { signal: AbortSignal.timeout(2000) },
  );
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.code, "request_timeout");
  assert.equal(signal.aborted, true);
});

test("shutdown deadline records failed cleanup while still attempting other owners", async () => {
  const stopped = [];
  const runtime = composeModules(
    [
      {
        name: "first",
        create: () => ({}),
        stop() {
          stopped.push("first");
        },
      },
      {
        name: "hung",
        create: () => ({}),
        stop() {
          stopped.push("hung");
          return new Promise(() => {});
        },
      },
    ],
    { shutdownTimeoutMs: 30 },
  );
  await runtime.start();
  const started = Date.now();
  await assert.rejects(runtime.stop(), AggregateError);
  assert.ok(Date.now() - started < 1000);
  assert.equal(runtime.state, "failed");
  assert.deepEqual(stopped, ["hung", "first"]);
  await assert.rejects(runtime.stop(), AggregateError);
  assert.deepEqual(stopped, ["hung", "first"]);
});

test("list query uses bounded validated pagination and allowlisted sorting", () => {
  assert.deepEqual(
    parseListQuery(
      new URLSearchParams("page=2&per_page=10&sort=name&direction=desc"),
      ["name"],
    ),
    { page: 2, perPage: 10, offset: 10, sort: "name", direction: "desc" },
  );
  for (const query of [
    "page=-1",
    "page=1.2",
    "per_page=101",
    "sort=secret",
    "direction=invalid",
  ]) {
    assert.throws(
      () => parseListQuery(new URLSearchParams(query), ["name"]),
      /Invalid/,
    );
  }
});

test("real HTTP readiness, independent request IDs and safe JSON errors", async (t) => {
  let ready = false;
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    readiness: () => ready,
    apiHandler: async (request, response) => {
      if (request.url === "/api/failure")
        throw new Error("private database secret");
      const body = await readJsonBody(request, 128);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(body));
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/health/ready`)).status, 503);
  ready = true;
  assert.equal((await fetch(`${base}/health/ready`)).status, 200);
  const failed = await fetch(`${base}/api/failure`);
  assert.equal(failed.status, 500);
  assert.doesNotMatch(await failed.text(), /private database secret/);
  const malformed = await fetch(`${base}/api/resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  const unsupported = await fetch(`${base}/api/resource`, {
    method: "POST",
    body: "{}",
  });
  assert.equal(unsupported.status, 415);
  const oversized = await fetch(`${base}/api/resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "x".repeat(200) }),
  });
  assert.equal(oversized.status, 413);
  const streamedStatus = await new Promise((resolve, reject) => {
    const request = httpRequest(
      `${base}/api/resource`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode));
      },
    );
    request.on("error", reject);
    request.write('{"text":"');
    setTimeout(() => {
      request.write("x".repeat(200));
      request.end('"}');
    }, 10);
  });
  assert.equal(streamedStatus, 413);
  const successful = await fetch(`${base}/api/resource`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"name":"live"}',
  });
  assert.deepEqual(await successful.json(), { name: "live" });
  assert.notEqual(
    failed.headers.get("x-request-id"),
    successful.headers.get("x-request-id"),
  );
});

test("lifecycle guards startup and shares concurrent shutdown cleanup", async () => {
  let finishStart;
  let finishStop;
  let stopCalls = 0;
  const runtime = composeModules([
    {
      name: "resource",
      create: () => ({}),
      start: () =>
        new Promise((resolve) => {
          finishStart = resolve;
        }),
      stop: () => {
        stopCalls++;
        return new Promise((resolve) => {
          finishStop = resolve;
        });
      },
    },
  ]);
  const starting = runtime.start();
  await assert.rejects(runtime.stop(), /during startup/);
  await assert.rejects(runtime.start(), /only start once/);
  finishStart();
  await starting;
  const first = runtime.stop();
  const second = runtime.stop();
  assert.equal(stopCalls, 1);
  finishStop();
  await Promise.all([first, second]);
  assert.equal(runtime.state, "stopped");
});
