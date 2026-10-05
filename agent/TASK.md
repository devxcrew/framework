# Framework task

## Config and infrastructure review - 2026-10-05

- [x] Compare config, env, events, queue, and storage with current app consumers.
- [x] Allow a production public URL to use a proxy port distinct from `APP_PORT`.
- [x] Keep `.env` loading and app-specific config schemas with each app.
- [x] Defer event, queue, and storage contracts until a consumer has an accepted workflow.
- [x] Verify current source in two fresh consumers; deployed proxy forwarding remains pending.

## Release 0.1.11

- [x] Align server validation errors with the shared `message` and `errors` shape.
- [x] Add module-owned `/api/v1` route registration and resource response examples.
- [x] Add typed public provider tokens and contract injection.
- [x] Add request diagnostics, bounded asynchronous health checks, and a shared rate limit store contract.
- [x] Update the consumer README and keep prior error responses readable during migration.
- [x] Run authenticated governance connection and the Framework test suite.
- [x] Verify a clean npm consumer for 0.1.10 and compile the corrected README example.
- [x] Verify a clean npm consumer for 0.1.11, including TypeScript compilation.
- [x] Run Cxsun and two registry consumer isolation checks with Framework 0.1.11; see the shared alignment audit.
- [x] Complete source commit, push, and npm publication to `latest`.

## App acceptance

- [ ] Verify proxy forwarding and TLS in a deployed app.
- [ ] Measure representative response times and set app budgets.

Production acceptance requires a deployed app; local Framework tests cannot establish it.


## Shared alignment audit - 2026-10-05

Release checks (25 tests) and fresh source consumers passed. Deployed proxy/TLS remains untested; source correction requires a new release version.

Authenticated live MCP verification passed. See the [alignment audit](D:/codexsun/projects/cxsun/agent/SHARED-ALIGNMENT.md). Version numbers remain unchanged. No release delivery was performed by this audit.
