import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiClientError,
  createApiClient,
} from "../../../dist/modules/api-client/api-client.provider.js";

test("browser API client merges headers and parses safe JSON errors", async () => {
  let request;
  const client = createApiClient({
    baseUrl: "https://app.example.test/",
    headers: { "X-App": "framework" },
    fetch: async (url, init) => {
      request = { url: String(url), headers: init.headers };
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid",
            message: "Bad input",
            fields: { name: ["Required"] },
          },
          requestId: "req-2",
        }),
        {
          status: 422,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": "req-2",
          },
        },
      );
    },
  });
  await assert.rejects(
    client.request("/api/v1/people", { headers: { "X-Call": "one" } }),
    (error) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 422);
      assert.equal(error.code, "invalid");
      assert.deepEqual(error.fields, { name: ["Required"] });
      return true;
    },
  );
  assert.equal(request.url, "https://app.example.test/api/v1/people");
  assert.equal(request.headers.get("X-App"), "framework");
  assert.equal(request.headers.get("X-Call"), "one");
});

test("browser API client returns JSON and supports empty responses", async () => {
  const client = createApiClient({
    baseUrl: "https://app.example.test",
    fetch: async () =>
      new Response('{"ok":true}', {
        headers: { "Content-Type": "application/json" },
      }),
  });
  assert.deepEqual(await client.request("/status"), { ok: true });
  const empty = createApiClient({
    baseUrl: "https://app.example.test",
    fetch: async () => new Response(null, { status: 204 }),
  });
  assert.equal(await empty.request("/resource"), undefined);
});
