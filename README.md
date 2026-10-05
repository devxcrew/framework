# @devxcrew/framework

Shared Node and TypeScript runtime for Codexsun apps. It provides module lifecycle, HTTP, validation, logging, health, security, and a browser API client. Business rules stay in each app module. Platform Core owns identity, roles, and tenancy.

## Install

Use Node 26.10 or newer.

```powershell
npm install @devxcrew/framework
```

Import server exports from `@devxcrew/framework`. Import the browser client from `@devxcrew/framework/client`.

## Owner modules and routes

Each app module exposes a public provider contract. The app composition root connects providers and passes their routes to `createApiRouter`. Keep Zod schemas, controllers, services, and persistence inside the owner module.

```ts
import {
  composeModules,
  createApiRouter,
  createApplicationServer,
  createModuleToken,
  defineModuleProvider,
  type ApiRoute,
} from "@devxcrew/framework";

const statusToken = createModuleToken<{ routes: ApiRoute[] }>("status");
const status = defineModuleProvider({
  token: statusToken,
  dependencies: [],
  create: (): { routes: ApiRoute[] } => ({
    routes: [
      {
        method: "GET",
        path: "/api/v1/status",
        handler(_request, response) {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ data: { ready: true } }));
        },
      },
    ],
  }),
});

const modules = composeModules([status]);
await modules.start();
const server = createApplicationServer({
  config: {
    name: "example",
    port: 3000,
    url: "http://localhost:3000",
    host: "localhost",
    mode: "development",
  },
  frontendDirectory: "dist/web",
  apiHandler: createApiRouter([modules.get(statusToken)]),
});
server.listen(3000);
```

`createApiRouter` matches methods and paths. Static paths take priority over `:id` paths. Owners validate route IDs, query strings, and JSON bodies. The router does not implement CRUD or business rules.

`composeModules` also supports the older string-based `ModuleProvider` contract. New modules can use tokens for typed dependencies and runtime token checks.

## HTTP and validation

- `readJsonBody` limits bytes and returns `unknown`. Validate it with an owner Zod schema through `parseWithSchema`.
- Validation failures return HTTP 422 with `message` and `errors`. The older `error.fields` shape remains during migration.
- `parseListQuery` checks page size and allowed sort fields. Owner schemas check business filters.
- Owners return resource data as `{ data }` and lists as `{ data, meta, links }`.
- `createApiClient` reads JSON responses and safe field errors. It does not add authentication or retry writes.

## Operations

- `createApplicationServer` sets basic security headers. Configure exact CORS origins, trusted proxy addresses, and rate limits for each app.
- The built-in rate limiter is local to one process. Set `rateLimit.store` to an app-owned atomic shared store when deployment uses multiple instances. Store failures return 503.
- Set `logger` for request logs. Set `onRequestComplete` to pass request data to a metrics or tracing adapter. Neither receives URL query values.
- Set `readiness` to a sync or async check. The server bounds it with `readinessTimeoutMs`. `createAsyncHealthProvider` bounds named async dependency checks.
- API handlers and module start and stop hooks have configurable deadlines. Owners must honor cancellation and release resources.

## Work on this repository

Connect to live governance before repository work. Stop if the authenticated connection fails. Do not use local or cached guidance as a fallback.

```powershell
npm run mcp:connect
npm run release:check
```

Keep secrets in ignored environment files. Commit and publish through the repository release workflow only when authorized.
