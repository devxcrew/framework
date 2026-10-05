import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationServer } from "../../../dist/http/server.js";
import { createHttpSecurityProvider } from "../../../dist/modules/http/http-security.provider.js";

test("HTTP security applies headers and enforces configured CORS", async (t) => {
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    security: {
      allowedOrigins: ["https://client.example.test"],
      allowedHeaders: ["Content-Type", "X-Request-ID"],
    },
    apiHandler(_request, response) {
      response.writeHead(200);
      response.end("ok");
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const allowed = await fetch(`${base}/api/items`, {
    headers: { Origin: "https://client.example.test" },
  });
  assert.equal(allowed.status, 200);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "https://client.example.test",
  );
  assert.equal(allowed.headers.get("x-content-type-options"), "nosniff");
  const denied = await fetch(`${base}/api/items`, {
    headers: { Origin: "https://attacker.example" },
  });
  assert.equal(denied.status, 403);
  const preflight = await fetch(`${base}/api/items`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://client.example.test",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("vary"), /Access-Control-Request-Method/);
  assert.match(preflight.headers.get("vary"), /Access-Control-Request-Headers/);
});

test("HTTP security trusts forwarded addresses only from exact trusted proxies", () => {
  const security = createHttpSecurityProvider({
    trustedProxyAddresses: ["127.0.0.1"],
  });
  const trusted = {
    socket: { remoteAddress: "127.0.0.1" },
    headers: { "x-forwarded-for": "198.51.100.8, 10.0.0.2" },
  };
  const untrusted = {
    socket: { remoteAddress: "203.0.113.9" },
    headers: { "x-forwarded-for": "198.51.100.8" },
  };
  assert.equal(security.clientAddress(trusted), "10.0.0.2");
  assert.equal(security.clientAddress(untrusted), "203.0.113.9");
});

test("HTTP security bounds requests per client", async (t) => {
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    security: { rateLimit: { limit: 1, windowMs: 60_000 } },
    apiHandler(_request, response) {
      response.writeHead(200);
      response.end("ok");
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/items`;
  assert.equal((await fetch(url)).status, 200);
  const blocked = await fetch(url);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

test("two server instances use one shared rate limit store", async (t) => {
  const counts = new Map();
  const store = {
    async consume(address, limit) {
      const count = (counts.get(address) ?? 0) + 1;
      counts.set(address, count);
      return count > limit ? 60 : 0;
    },
  };
  const makeServer = () =>
    createApplicationServer({
      config: {},
      frontendDirectory: ".",
      security: { rateLimit: { limit: 1, windowMs: 60_000, store } },
      apiHandler(_request, response) {
        response.end("ok");
      },
    });
  const first = makeServer();
  const second = makeServer();
  await Promise.all([
    new Promise((resolve) => first.listen(0, "127.0.0.1", resolve)),
    new Promise((resolve) => second.listen(0, "127.0.0.1", resolve)),
  ]);
  t.after(() =>
    Promise.all([
      new Promise((resolve) => first.close(resolve)),
      new Promise((resolve) => second.close(resolve)),
    ]),
  );
  const firstUrl = `http://127.0.0.1:${first.address().port}/api/status`;
  const secondUrl = `http://127.0.0.1:${second.address().port}/api/status`;
  assert.equal((await fetch(firstUrl)).status, 200);
  const denied = await fetch(secondUrl);
  assert.equal(denied.status, 429);
  assert.equal(denied.headers.get("retry-after"), "60");
});

test("an unavailable shared rate limit store fails safely", async (t) => {
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    security: {
      rateLimit: {
        limit: 1,
        windowMs: 60_000,
        storeTimeoutMs: 20,
        store: { consume: () => new Promise(() => {}) },
      },
    },
    apiHandler() {
      assert.fail("The handler must not run without a rate limit decision.");
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/status`,
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "security_unavailable");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
