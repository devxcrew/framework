# Framework plan

## Best fit

| Option | Fit for Codexsun | Decision |
| --- | --- | --- |
| Current Node and TypeScript package | Matches module-owned providers and keeps the public package small. | Keep and improve it. |
| [Fastify](https://fastify.dev/docs/latest/Guides/Plugins-Guide/) | Its plugin scope suits a larger HTTP surface. | Add an adapter only if apps need it. |
| [NestJS](https://docs.nestjs.com/modules) | Its modules and injection overlap with the current runtime. | No migration now. |

## Missing work

| Priority | Missing now | Why it is needed | Best fit for Codexsun |
| --- | --- | --- | --- |
| 1 | Validation errors use `error.fields`, while the shared API rule uses `message` and `errors`. | Forms need one field error shape. | Align the server response. Let the client read both shapes during migration. |
| 1 | One app-wide `apiHandler` receives every API route. | Modules need clear resource routes and response shapes. | Register owner routes and check `data`, `meta`, and `links` in a consumer. |
| 1 | Module dependencies use string names and `unknown` values. | Wrong contracts can reach runtime. | Type public provider keys and injected contracts. |
| 1 | The README has old setup steps and says MCP failures do not block work. | Consumers may follow the wrong setup and governance rules. | Update it for the published package and required live connection. |
| 1 | The cross-app isolation probe did not complete because port 5192 refused a connection. | The published package still needs full consumer proof. | Fix the probe setup and rerun it against npm 0.1.9. |
| 2 | HTTP requests do not feed the structured logger or a trace hook. | Operators need request and failure context. | Add an optional request hook. Let apps choose the telemetry exporter. |
| Later | Health checks are synchronous and rate limits are process-local. | Live dependencies and multiple instances need shared status and limits. | Add bounded checks and a shared limit adapter when a deployed app needs them. |
| Later | Proxy, TLS, and performance acceptance are unverified. | Public deployment needs known security and response limits. | Test these in each deployed app with its real proxy. |

## Order

1. Align the API error contract, module routes, and README.
2. Type provider contracts and complete the published consumer probe.
3. Add operational hooks when an app has a measured need.

Keep identity, roles, and tenancy in Platform Core. Add database, queue, mail, and storage support only for a real consumer.
