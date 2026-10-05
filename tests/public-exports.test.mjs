import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  createHealthProvider,
  createHttpSecurityProvider,
  createLogger,
  createValidationProvider,
} from "@devxcrew/framework";
import { ApiClientError, createApiClient } from "@devxcrew/framework/client";

test("package exports expose owner providers and the browser client", async () => {
  assert.equal(createValidationProvider().parse(z.string(), "value"), "value");
  assert.equal(createHealthProvider({ app: () => true }).isReady(), true);
  assert.equal(typeof createHttpSecurityProvider().handle, "function");
  assert.equal(typeof createLogger({ sink() {} }).info, "function");

  const client = createApiClient({
    baseUrl: "https://consumer.example.test",
    fetch: async () =>
      new Response(JSON.stringify({ message: "ok" }), {
        headers: { "Content-Type": "application/json" },
      }),
  });
  assert.deepEqual(await client.request("/api/status"), { message: "ok" });
  assert.equal(typeof ApiClientError, "function");
});
