# Framework task

## Release 0.1.10

- [x] Align server validation errors with the shared `message` and `errors` shape.
- [x] Add module-owned `/api/v1` route registration and resource response examples.
- [x] Add typed public provider tokens and contract injection.
- [x] Add request diagnostics, bounded asynchronous health checks, and a shared rate limit store contract.
- [x] Update the consumer README and keep prior error responses readable during migration.
- [x] Run authenticated governance connection and the Framework test suite.
- [ ] Verify a clean npm consumer and the Cxsun isolation probe.
- [ ] Complete source commit, push, and npm publication.

## App acceptance

- [ ] Verify proxy forwarding and TLS in a deployed app.
- [ ] Measure representative response times and set app budgets.

Production acceptance requires a deployed app; local Framework tests cannot establish it.
