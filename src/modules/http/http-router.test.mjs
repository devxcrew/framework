import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { createApplicationServer } from "../../../dist/http/server.js";
import {
  createApiRouter,
  parseListQuery,
  readJsonBody,
} from "../../../dist/modules/http/http.provider.js";
import { parseWithSchema } from "../../../dist/modules/validation/validation.provider.js";

test("owner routes use resource paths and safe validation responses", async (t) => {
  const people = {
    routes: [
      {
        method: "GET",
        path: "/api/v1/people/:id",
        handler(_request, response, _context, params) {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ data: { id: params.id } }));
        },
      },
      {
        method: "GET",
        path: "/api/v1/people/create",
        handler(_request, response) {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ data: { form: true } }));
        },
      },
      {
        method: "GET",
        path: "/api/v1/people",
        handler(request, response) {
          const query = parseListQuery(
            new URL(request.url, "http://localhost").searchParams,
            ["name"],
          );
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              data: [],
              meta: {
                current_page: query.page,
                per_page: query.perPage,
                total: 0,
                last_page: 1,
              },
              links: {
                first: "/api/v1/people?page=1",
                last: "/api/v1/people?page=1",
                prev: null,
                next: null,
              },
            }),
          );
        },
      },
      {
        method: "POST",
        path: "/api/v1/people",
        async handler(request, response) {
          const input = parseWithSchema(
            z.object({ name: z.string().min(2) }),
            await readJsonBody(request),
          );
          response.writeHead(201, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ data: input }));
        },
      },
    ],
  };
  const server = createApplicationServer({
    config: {},
    frontendDirectory: ".",
    apiHandler: createApiRouter([people]),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const list = await fetch(`${base}/api/v1/people?page=2`);
  assert.equal(list.status, 200);
  assert.deepEqual(Object.keys(await list.json()), ["data", "meta", "links"]);
  const staticRoute = await fetch(`${base}/api/v1/people/create`);
  assert.deepEqual(await staticRoute.json(), { data: { form: true } });
  const detail = await fetch(`${base}/api/v1/people/abc`);
  assert.deepEqual(await detail.json(), { data: { id: "abc" } });

  const invalid = await fetch(`${base}/api/v1/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A" }),
  });
  assert.equal(invalid.status, 422);
  const failure = await invalid.json();
  assert.equal(failure.message, "Validation failed");
  assert.deepEqual(failure.errors, {
    name: ["Too small: expected string to have >=2 characters"],
  });
  assert.deepEqual(failure.error.fields, failure.errors);

  const wrongMethod = await fetch(`${base}/api/v1/people`, { method: "PATCH" });
  assert.equal(wrongMethod.status, 405);
  assert.match(wrongMethod.headers.get("allow"), /GET/);
  assert.equal((await fetch(`${base}/api/v1/missing`)).status, 404);
  assert.equal((await fetch(`${base}/api/v1/people/a%2Fb`)).status, 400);
});

test("duplicate owner routes fail during composition", () => {
  const route = { method: "GET", path: "/api/v1/people/:id", handler() {} };
  assert.throws(
    () =>
      createApiRouter([
        { routes: [route, { ...route, path: "/api/v1/people/:name" }] },
      ]),
    /Duplicate API route/,
  );
});
