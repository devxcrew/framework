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
| 1 | App-owned isolation proof on the latest package | Two apps must keep sessions and data apart. | Upgrade the Cxsun release fixture from 0.1.8, then run its registry probe. |
| 2 | Real proxy and TLS acceptance | Local checks cannot prove production forwarding and HTTPS. | Check the deployed app with its own proxy. |
| 2 | Response time budget | Operators need a measured target before tuning. | Measure representative app routes and set app-owned budgets. |

The 0.1.11 release supplies standard validation errors, owner routes, typed provider tokens, request diagnostics, bounded asynchronous health checks, and a shared rate limit store contract. Identity, roles, and tenancy remain in Platform Core. Add other infrastructure only when a consumer needs it.
