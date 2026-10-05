# Framework plan

## Best fit

| Choice | Why it fits | Decision |
| --- | --- | --- |
| Current Node and TypeScript package | Gives Codexsun small, module-owned public contracts. | Keep it. |
| Fastify adapter | Useful if an app outgrows the native HTTP layer. | Add only for a real consumer. |
| NestJS migration | Duplicates the current module runtime. | Do not migrate now. |

## Next work

| Priority | Missing | Why it is needed | Best fit for Codexsun |
| --- | --- | --- | --- |
| 1 | Verify production URL config in a consuming app | A proxy can expose HTTPS on a port that differs from the Node listener. | Check an app with `APP_URL`, `APP_PORT`, and `APP_HOST` set for its proxy. |
| 1 | App-owned isolation proof on the latest package | Two apps must keep sessions and data apart. | Upgrade the Cxsun release fixture from 0.1.8, then run its registry probe. |
| 2 | Real proxy and TLS acceptance | Local checks cannot prove production forwarding and HTTPS. | Check the deployed app with its own proxy. |
| 2 | Response time budget | Operators need a measured target before tuning. | Measure representative app routes and set app-owned budgets. |

The 0.1.11 release supplies standard validation errors, owner routes, typed provider tokens, request diagnostics, bounded asynchronous health checks, and a shared rate limit store contract. Identity, roles, and tenancy remain in Platform Core. Add other infrastructure only when a consumer needs it.

## Infrastructure decisions

| Area | Current state | Decision |
| --- | --- | --- |
| Config | `readApplicationConfig` validates shared startup values. | Keep it and allow a separate public port in production. |
| Env | Apps already load `.env` and own their extra settings. | Keep file loading and secret schemas with each app. |
| Events | No inspected consumer needs shared event delivery. | Add a public event contract when an owner needs delivery. |
| Queue | No inspected consumer needs durable jobs from this package. | Choose transport and retries with the first real job owner. |
| Storage | No inspected consumer needs shared object storage. | Add an adapter contract with the first file-owning module. |

## Foundation extraction - 2026-10-05

The shared owner extraction is implemented and connected to Cxsun development snapshots.
Release new package versions before changing other apps to registry pins.
Use consumer verification for fresh installation and preserved-data upgrades.
Production deployment acceptance remains open.
