# Framework foundation owner plan

## Package migration release - 2026-10-05

- [x] Retrieve authenticated cloud guidance.
- [x] Publish @devxcrew/framework 0.1.8 and @devxcrew/ui 0.2.0 under MIT.
- [x] Verify all six existing apps and the UIUX gallery with their new registry dependencies.
- [x] Verify two fresh registry apps, 44 tests and 52 source files each, live SQLite and cross-app denial.
- [x] Record exact archive checksums, registry integrity and migration evidence.
- [x] Commit and push the reviewed package migration under existing authorization.

Historical checkpoints below retain their original package names and results.


Date: 2026-10-04
Status: Runtime subset implemented and reviewed locally. Release acceptance remains open.
Master: projects/cxsun/agent/PLAN.md.

## Current review - 2026-10-04

Authenticated MCP retrieval and `npm run release:check` pass. Six real HTTP and lifecycle tests pass.
Maintenance now uses installed Tools. Public runtime providers include composition, safe errors, parsing, deadlines and readiness.
Tasks 02.01, 03.01 and 06.01 remain in-review for their implemented subsets.
Task 03.02 requires agreed consumer transaction and idempotency requirements before additional primitives.
Task 03.03 remains conditional on an accepted asynchronous consumer. Do not add speculative transport.
Complete performance budgets, deployed proxy/security acceptance and an independently installed consumer before release acceptance.
Provider factories must defer resource acquisition to start hooks. Startup hooks currently have no bounded deadline.
Document or implement an agreed startup deadline under 03.01, then verify an unresponsive startup owner.
Current source changes remain unpublished at package version 0.1.7. Choose a new release version before publication.

## Initial baseline - historical

Verified 2026-10-04: release:check passed dependency order, version 0.1.7, line endings, TypeScript build, and package dry run. Source exports readApplicationConfig and createApplicationServer. API requests return 404 unless a development handler takes ownership. No framework test script or dedicated test files exist. Configuration is accepted by the server but is not applied there. Maintenance scripts still depend on a sibling MCP Governance checkout. README has stale Cxsun build and connection-failure statements.

## Delivery tasks

### 8.1 Framework — shared/framework

Purpose: reusable business-neutral runtime and transport.
Legacy references: C01-C03, C06-C08, F01-F07.

| ID | Work | Acceptance |
| --- | --- | --- |
| 01.01 | Audit exports, lifecycle, dependencies, evidence and owner governance | Gaps recorded with source evidence |
| 02.01 | Define provider registration, parsed requests, trusted context, API envelopes and resource contracts | No private cross-owner imports or central business implementations |
| 03.01 | Refine configuration, routing, errors, health, shutdown, limits and HTTP security hooks | Safe failures and correct resource API behavior |
| 03.02 | Define transaction, cancellation, concurrency and idempotency primitives actually needed | Retries and stale writes cannot silently corrupt state |
| 03.03 | Provide event/job transport contracts only for accepted asynchronous needs | Owner payloads, committed publication and retried consumers verified |
| 06.01 | Verify consumer integration, performance budgets and fault handling | File-backed and real HTTP integration evidence |

## Dependencies and sequence

02.02 Platform trusted context; 02.04 Cxsun resource mapping; 02.09 release matrix.
Keep global phase and task IDs. Do not restart numbering.
Complete Phase 01 evidence before Phase 02 contracts.
Implement accepted contracts after dependent owners agree their boundaries.
Cxsun owns live application composition. Platform owns identity persistence.

## Acceptance and handoff

Use public provider contracts and keep business implementations inside their owners.
Keep events and consumers module-owned. Add transport only for accepted asynchronous needs.
Use the current cloud governance instructions instead of duplicating shared standards here.
Run existing checks and add meaningful verification for changed behavior during implementation.
Final consumer acceptance uses configured file-backed SQLite and restart persistence.
Do not substitute mock or memory adapters for release evidence.
Record outputs, limitations, compatibility, and integration evidence in TASK.md and AUDIT.md.
Submit each task for review before marking it accepted.
Publication, commits, pushes, and deployment require applicable user authorization.

## Previous roadmap - historical reference

The following earlier plan is retained for history. The numbered owner tasks above control current delivery.

# Reusable framework build plan

Date: October 3, 2026

Status: Proposed roadmap. Features below are not implemented unless marked existing.

## 1. Goal and MVP

Build a reusable TypeScript framework for isolated applications with strict module ownership.
Keep business rules inside application modules. Keep framework services business-neutral.
MVP means the smallest version that applications can safely use in production.
Start with runtime, HTTP, validation, safe errors, logging, health, and security integration.
Add optional services only when a real application needs them.

Current package: `@devxcrew/core-framework@0.1.7`, ESM with declarations, Node.js 26.10.0 or newer.
Existing code validates application configuration and serves frontend files through native Node HTTP.
It supports a development handler and SPA fallback. Backend API requests currently return 404.
The server accepts configuration but does not apply it. No dedicated tests were found.
Keep existing exports compatible while introducing modules.

## 2. Lessons from established frameworks

These are local design decisions, not compatibility promises.

| Reference | Adopted pattern | Local decision |
| --- | --- | --- |
| NestJS | Encapsulated modules and exported providers | Explicit typed provider contracts and dependency checks |
| NestJS lifecycle | Startup and shutdown hooks | Ordered startup, cleanup after failure, and bounded shutdown |
| Laravel providers | Registration and boot phases | Separate service registration from resource startup |
| Laravel queues | Reliable background processing | Bounded retries, failure handling, and transaction-aware dispatch |
| Next.js | Server and client boundaries | Separate browser-safe contracts from server runtime exports |
| Frappe hooks | Extension and lifecycle hooks | Typed owner-local hooks with explicit ordering and failure rules |
| Frappe database | Transactions and commit hooks | Explicit transactions and committed event publication |

Use existing libraries before building replacement routers, ORMs, or cryptography.
Evaluate maintenance, licensing, compatibility, and performance before selecting dependencies.
Keep Node as the first runtime. Do not require NestJS, Next.js, Frappe, or Laravel to consume this package.

## 3. Ownership

| Owner | Responsibilities |
| --- | --- |
| Framework | Business-neutral runtime, transport, technical adapters, and operational contracts |
| Platform Core, when available | Identity, sessions, permissions, RBAC, organizations, and tenancy |
| Shared UI | Presentation, accessibility, login presentation, and workspace shell |
| Shared Tools | Generators, development lifecycle, ports, and release commands |
| MCP Governance | Shared rules and authenticated guidance |
| Application composition root | Choose modules, configure adapters, and inject public providers |
| Application capability module | Business rules, schemas, repositories, migrations, API, UI, events, jobs, and tests |

Platform Core is absent from the inspected workspace. Do not invent packages or claim authentication.
Framework accepts its public integration contracts when available.
Do not centralize application business implementations in framework services.

## 4. Module architecture

Use a modular monolith with explicit registration. Avoid process-wide mutable application registries.
Start dependency injection with typed factories. Add a container only after concrete requirements justify it.

Proposed layout:

```text
src/
  index.ts
  modules/
    runtime/
      runtime.provider.ts
      runtime.schema.ts
      runtime.service.ts
      runtime.test.ts
    http/
      http.provider.ts
      http.routes.ts
      http.service.ts
      http.test.ts
    validation/
    errors/
    context/
    logging/
    health/
    security/
    static/
    api-client/
```

Create optional folders only when implemented. Keep adapters and tests inside their owner.
Use `<module>.provider.ts` for registration and public communication.
Add `<module>.controller.ts` only when orchestration needs it. Routes remain declarative.
Expose selected contracts through package export maps. Keep server exports separate from browser-safe exports.
Reject duplicate registrations, missing dependencies, and dependency cycles during startup.
Keep files below 700 lines when practical. Review 700–900 lines and split above 900 within the owner.

Application capability example:

```text
backend/modules/contacts/
  contacts.provider.ts
  contacts.routes.ts
  contacts.controller.ts
  contacts.schema.ts
  contacts.service.ts
  contacts.repository.ts
  migrations/
  tests/
frontend/modules/contacts/
  contacts.provider.ts
  contacts.routes.tsx
  contacts.schema.ts
  contacts.form.tsx
  contacts.api.ts
  contacts.hooks.ts
  tests/
```

Contacts is an ownership example, not a framework feature.
Sibling modules use injected public provider contracts. They never import private sibling files.
Keep matching frontend and backend capabilities separate. Use `.tsx` only for React rendering.
Add owner-local events and workers only for real asynchronous needs.

## 5. Mandatory MVP modules

| Module | Required features | Acceptance evidence |
| --- | --- | --- |
| Runtime | Typed configuration, module registration, start, stop, and cleanup | Invalid settings stop startup. Partial startup releases resources |
| HTTP | Resource routing, middleware order, body limits, deadlines, and cancellation | Direct calls, malformed requests, limits, and concurrent requests pass |
| Validation | Zod parsing helpers and safe field errors | Invalid input fails before services or persistence |
| Errors | Stable codes, safe HTTP mapping, and request IDs | Unexpected errors hide private data and stack traces |
| Context | Request ID, deadline, cancellation, and injected trusted context | Concurrent requests cannot exchange identity or scope |
| Logging | Structured logs, levels, redaction, and request timing | Secret fixtures never appear in logs |
| Health | Liveness, readiness, and registered dependency checks | Readiness reflects startup, dependency failure, and shutdown |
| Security | CORS, headers, proxy trust, request limits, and policy hooks | Untrusted origins and spoofed forwarding headers fail |
| Static | Frontend hosting, streams, safe real paths, and development adapter | Traversal, symlink escape, missing assets, HEAD, and SPA routes pass |
| API client | Fetch wrapper, cancellation, base URL, and safe error parsing | Browser bundle contains no server implementation or secrets |

Applications select endpoint exposure explicitly. Detailed diagnostics require operations authorization.
Cookie-authenticated mutations require a defined CSRF defense before production use.
Protected applications fail closed without their required verified identity provider.
Public applications must run without database, cache, queue, or Platform dependencies.

## 6. Standard service catalog after MVP

Each service needs a real consumer, a public contract, an adapter, and owner-local tests.
Inactive modules must not create connections, workers, timers, or subscriptions.

| Module | Features | Ownership and dependencies |
| --- | --- | --- |
| Database | Pools, parameterized queries, transactions, health, and cleanup | Business owners keep tables, repositories, and constraints |
| Migrations | Ordered runner, lock, checksums, status, and repeat-safe seeds | Owners provide migrations. Runner owns execution mechanics |
| Cache | Scoped keys, TTL, invalidation, and stampede control | Owners define cached data and invalidation policy |
| HTTP client | Connection reuse, deadlines, response limits, and controlled retries | Owners define integrations and credentials |
| Storage | Private objects, streams, signed access, and upload limits | Owners authorize files and set retention |
| Events | Typed publication and subscriptions with failure rules | Producers own contracts. Consumers own handlers |
| Queue | Durable jobs, retries, backoff, failure queue, and drain | Owners keep job schemas and idempotent workers |
| Scheduler | Time zones, overlap policy, missed runs, and coordination | Owners define jobs. Multiple instances need a lease |
| Outbox | Transaction-bound messages, delivery, retries, and recovery | Business transaction creates messages. Infrastructure delivers them |
| Idempotency | Atomic keys, payload checks, expiry, and saved results | Owners define operation semantics and trusted scope |
| Observability | Metrics, traces, and optional OpenTelemetry adapter | Redact sensitive data and limit metric labels |
| OpenAPI | Route documentation, schemas, and contract checks | Owners supply descriptions. Protect private documentation |
| Mail | Transport adapters, deadlines, status, and retry integration | Owners keep templates and notification rules |
| Webhooks | Signatures, replay limits, retries, and deduplication | Owners define payloads and recipient authorization |
| Localization | Locale parsing and neutral formatting | UI and capability owners keep translations |
| Testing | Provider fakes, test server, isolated resources, and adapter contracts | Tests remain with their service or capability owner |

Choose one database adapter first. Add another only after a consumer needs it.
Do not add universal business repositories, central business schemas, or generic business CRUD engines.
Memory adapters support tests. Document their limitations before any production use.

## 7. Advanced possibilities

| Capability | Trigger | Required controls |
| --- | --- | --- |
| SSE and WebSockets | Live application updates | Verified subscriptions, scope isolation, reconnect, and backpressure |
| Search | Full-text search needs | Owner indexes, scope filters, and rebuild recovery |
| Durable workflows | Long operations with waiting and recovery | Versioned state, idempotent steps, deadlines, and compensation |
| Distributed coordination | Exclusive work across instances | Lease expiry, fencing, and process-failure recovery |
| Feature flags | Gradual releases or experiments | Trusted targeting, audit, fallback, and expiry |
| Resilience | Unreliable dependencies | Circuit breakers, bulkheads, retry budgets, and bounded retries |
| Streaming | Large imports, exports, or downloads | Bounded memory, cancellation, progress, and resumability |
| GraphQL or RPC | Confirmed integration need | Owner schemas, authorization, limits, and version policy |
| Edge or serverless adapters | Required deployment target | Tested parity and explicit unsupported Node features |
| Extension packages | Trusted reusable capabilities | Versioned contracts and allowlisted registration |
| Metadata tooling | Repeated resource and form definitions | Owner metadata, explicit security, and domain escape paths |
| Audit transport | Compliance evidence delivery | Platform or business owners define events and retention |
| AI adapters | Requested AI capability | Budget, timeout, data controls, and owner prompts and tools |

CQRS, event sourcing, microservices, and runtime plugin loading are not defaults.
Untrusted plugins need a separate isolation design. Provider registration is not a sandbox.
Business workflows, reporting rules, payments, and document models remain outside the framework.

## 8. Runtime parameter catalog

Existing parameters work today. Proposed parameters require schemas, runtime behavior, documentation, and tests.
Defaults below are starting points. Validate them against measured application workloads.

| Parameters | Status | Rule or proposed default |
| --- | --- | --- |
| `APP_NAME`, `APP_PORT`, `APP_URL`, `APP_MODE` | Existing | Required. Port 1–65535. URL port must match. Mode development or production |
| `APP_HOST` | Existing | Optional. Current parser uses URL hostname when omitted |
| `APP_ID`, `APP_USER` | Existing governance | Caller context. These do not authenticate application users |
| `MCP_SERVER_URL` | Existing governance | Exact endpoint `https://mcp.codexsun.com/mcp` |
| `MCP_SERVER_SECRET` | Existing secret | Server-only, ignored by Git, and always redacted |
| `LOG_LEVEL`, `LOG_FORMAT` | MVP proposal | `info`, `json`. Validate allowed choices |
| `HTTP_BODY_LIMIT_BYTES` | MVP proposal | 1,048,576 for JSON. Uploads need separate limits |
| `HTTP_REQUEST_TIMEOUT_MS` | MVP proposal | 30,000. Explicit exceptions for streaming |
| `HTTP_HEADERS_TIMEOUT_MS` | MVP proposal | 10,000. Verify actual Node server behavior |
| `SHUTDOWN_TIMEOUT_MS` | MVP proposal | 30,000. Stop new work, drain, then close |
| `CORS_ALLOWED_ORIGINS` | MVP proposal | Empty list. No credentialed wildcard |
| `TRUST_PROXY` | MVP proposal | Disabled. Allow explicit trusted proxies or networks |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | MVP proposal | Route profiles. Multiple instances need shared enforcement |
| `FRONTEND_DIRECTORY`, `HEALTH_ENABLED` | MVP proposal | Validated app-owned directory. Health enabled for runtime deployment |
| `DATABASE_URL`, `DATABASE_POOL_MAX`, `DATABASE_TIMEOUT_MS` | Data phase | Secret URL. Initial pool 10 and acquisition timeout 5,000 ms |
| `CACHE_DRIVER`, `CACHE_URL`, `CACHE_TTL_SECONDS` | Service phase | Explicit adapter. Secret URL. TTL 60 where suitable |
| `QUEUE_DRIVER`, `QUEUE_URL`, `QUEUE_CONCURRENCY` | Async phase | Durable adapter. Secret URL. Initial concurrency 5 |
| `QUEUE_MAX_ATTEMPTS`, `QUEUE_BACKOFF_MS` | Async phase | Initial 3 attempts and 1,000 ms base with bounded jitter |
| `SCHEDULER_TIMEZONE` | Async phase | UTC. Jobs may declare another valid time zone |
| `STORAGE_DRIVER`, `STORAGE_BUCKET`, `UPLOAD_MAX_BYTES` | Storage phase | Explicit adapter, private bucket, and owner-approved limit |
| `MAIL_DRIVER`, `MAIL_FROM` | Integration phase | Explicit transport and validated sender. Credentials stay secret |
| `OTEL_EXPORTER_OTLP_ENDPOINT`, `TRACE_SAMPLE_RATIO` | Operations phase | Optional exporter. Initial ratio 0.1, bounded 0–1 |
| Identity, portal, session, and tenant settings | Platform dependency | Use actual public Platform contracts when implemented |

Modules own schemas, units, ranges, defaults, secret labels, and restart behavior.
MVP configuration is immutable after startup. Do not introduce `APP_ENV` beside `APP_MODE` as a competing authority.
Later live settings need authorization, versioning, atomic validation, audit records, and rollback.
Do not hot-reload credentials, bind addresses, or pool settings without adapter support.

Provide redacted live diagnostics for app ID, version, build ID, uptime, modules, adapters, and lifecycle state.
Show safe limits, readiness, dependency latency, active requests, errors, and shutdown state.
When services exist, show queue age, retries, pool use, cache results, and delivery lag.
Restrict detailed diagnostics. Never expose secrets, private URLs, raw payloads, or private tenant lists.
Do not use individual users, record IDs, or request IDs as metric labels.

## 9. Resource, validation, and navigation contracts

Request flow: bounded parsing -> trusted context -> owner Zod schema -> controller -> service -> repository -> safe response.
Controllers map parsed data and transport results. Services enforce domain rules and permissions.
Database constraints remain the final defense against concurrent invalid writes.

Use `/api/v1/<resources>` with GET list, POST create, GET detail, PUT/PATCH update, and DELETE removal.
Define response envelopes and validation status from the live central resource contract before implementation.
Use stable error codes, field paths, safe messages, and request IDs.
Never expose database errors or secrets.

Default list queries to `page=1` and `per_page=20`. Cap page size at 100 unless the owner documents another limit.
Allowlist filters and sort fields. Reject malformed API queries. Normalize malformed browser values to defaults.
Keep list state in browser URLs. Reset page when filters change.
Preserve query state on breadcrumbs, refresh, edit return, and Back/Forward navigation.
Modules own breadcrumb metadata. Shared UI renders it.
Use module-owned TanStack Form with Zod. Validate independently with Zod on the server.
Preserve form values after failures and map safe server field errors.
Scope frontend caches by verified app, portal, organization, resource, and normalized query.

## 10. Reliability and security rules

1. Isolate application state, connections, cache keys, and storage prefixes.
2. Resolve trusted identity and organization scope on the server.
3. Enforce permissions on operations and subscriptions, not only navigation.
4. Verify separate user, admin, and super-admin session scopes through Platform contracts.
5. Clear scoped frontend state after identity or organization changes.
6. Validate queue payloads again at worker entry.
7. Use parameterized queries and explicit mutation field allowlists.
8. Bound bodies, uploads, execution time, retries, and concurrency.
9. Redact logs and hide private error details.
10. Validate static real paths and block symlink escape.
11. Restrict outbound destinations when applications accept user-supplied URLs.
12. Reject production automatic login. Development automatic login requires a real Platform adapter.

Assume jobs can run more than once. Do not promise exactly-once delivery.
Use idempotency and constraints for repeat-safe effects.
Use an outbox when durable messages must agree with database commits.
Avoid network calls inside long database transactions.

## 11. Delivery phases

| Phase | Work | Exit gate |
| --- | --- | --- |
| 0: Contracts | Live governance, consumer inspection, provider contracts, errors, and library trials | Choices fit current consumers and ownership rules |
| 1: MVP | Runtime, HTTP, validation, context, errors, logs, health, security hooks, static hosting, and client | Package, startup, shutdown, direct API, and isolation tests pass |
| 2: Reuse | Adopt in one app, then a second isolated consumer through public exports | No copied runtime code or private imports. Browser flows pass |
| 3: Data | One database adapter, transactions, migrations, then required common services | Real-service integration, rollback, restore, and scope tests pass |
| 4: Async | Concrete queue job, scheduler if needed, idempotency, retries, and outbox if needed | Accepted work survives restart. Redelivery does not duplicate protected effects |
| 5: Platform | Actual identity, sessions, RBAC, and tenancy integrations | Wrong-role, cross-app, cross-portal, and cross-organization denial pass |
| 6: Advanced | One measured advanced requirement at a time | Real consumer, recovery evidence, and acceptable operational costs |

Phase 5 may start earlier when real Platform contracts become available.
Preview sessions cannot satisfy identity acceptance.
Each phase must record passed, failed, blocked, partial, and untested results in TASK and AUDIT.
Measure startup, memory, latency, concurrency, and shutdown in Phase 2.
Set performance budgets from documented workloads before claiming scalability.

## 12. Verification and releases

Verify public imports, dependency cycles, owner-local code, and frontend/backend separation.
Test malformed input, unknown fields, body limits, cancellation, concurrent requests, and safe errors.
Test startup failure cleanup, occupied ports, repeated start/stop, and shutdown deadlines.
Test traversal, symlinks, HEAD, missing assets, and direct SPA routes.
Verify secret redaction, CORS, proxy spoofing, CSRF when required, and trusted scope isolation.
Use real backing services for database and durable queue acceptance.
Test transactions, migrations, worker crashes, duplicates, retries, and dependency outages.
Verify direct URLs, refresh, forms, breadcrumbs, filters, and Back/Forward in running apps.
Test packed ESM exports, declarations, and clean consumer installation.

Run repository checks, `lines:check`, and `check:versions` for applicable changes.
Run `release:check` before release. Use `fix:line-endings` when formatting needs repair.
Use `version-bump` only for a prepared release. Preserve changelog history and aligned metadata.
Commit subjects use `#<patch> - <release title>`.
Commit, push, and publish require user authorization.
Document public contract changes, migration instructions, and deprecation periods.
During version 0.x, identify breaking changes explicitly.

## 13. Completion checklist

- [ ] Implement and document MVP contracts.
- [ ] Verify module boundaries and package export maps.
- [ ] Demonstrate two isolated consumers.
- [ ] Pass runtime, security, static hosting, and browser tests.
- [ ] Document parameter units, limits, secret handling, and restart behavior.
- [ ] Start optional services only when registered.
- [ ] Record measured budgets and tested recovery procedures.
- [ ] Keep TASK, AUDIT, release metadata, and verification evidence accurate.

## 14. Official sources

Reviewed October 3, 2026. This roadmap is a local synthesis, not a claim that these features exist today.

- Live `governance://code-standard` and `governance://app-setup`, retrieved through `npm run mcp:connect`.
- [NestJS modules](https://docs.nestjs.com/modules).
- [NestJS lifecycle](https://docs.nestjs.com/fundamentals/lifecycle-events).
- [Laravel providers](https://laravel.com/framework/docs/12.x/providers).
- [Laravel queues](https://laravel.com/framework/docs/12.x/queues).
- [Next.js server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- [Frappe hooks](https://docs.frappe.io/framework/user/en/python-api/hooks).
- [Frappe background jobs](https://docs.frappe.io/framework/user/en/api/background_jobs).
- [Frappe database API](https://docs.frappe.io/framework/user/en/api/database).

Keep shared guidance in MCP Governance. Maintain local task, plan, skills, and release records.
Implement later phases through separately scoped work. This request authorizes planning, not runtime implementation or publication.

## Task checkbox tracking

Use [owner phase checklist](TASK.md) for current checkboxes and numbered substeps.
Use [master checklist](D:/codexsun/projects/cxsun/agent/CHECKLIST.md) for all owners and shared release gates.
Keep task IDs unchanged. Check a parent only after all its acceptance criteria pass.

## Local completion wave - 2026-10-04

- [x] 03.01.3 Bound startup hooks with a total startupTimeoutMs budget and cancellation signal.
- [x] 06.01.3 Verify unresponsive startup abort and reverse resource cleanup.
- [x] 03.03.1 Decision: no generic asynchronous transport is required by the current identity consumer.

Seven Framework tests and release:check pass. Default startup and shutdown budgets are 30000 milliseconds each.
Start hooks receive an AbortSignal. Owners must release resources after cancellation and avoid late acquisition.
JavaScript cannot forcibly stop an uncooperative hook or synchronous execution.
Framework owns runtime deadlines. App owners own process termination policy.
Proposed next compatible release: @devxcrew/core-framework 0.1.8. The source manifest remains 0.1.7 until coordinated release approval.
Upgrade: existing one-argument start hooks continue to work. Long startup hooks must explicitly configure the budget.
No consumer requires a durable queue now. Add module-owned events or queues only when an accepted asynchronous workflow requires them.
Remaining: independent registry consumer and production proxy/performance operational acceptance.
No publication, commit, push or operational database change occurred.

## Local scope clarification - 2026-10-04

The user deferred production deployment. Complete and review the local foundation first.
Current verified local substeps are checked in TASK.md. Production controls remain explicitly deferred.
Registry release and app integration gates remain open. This clarification does not claim complete release or production acceptance.


## Current execution - 2026-10-04

Local checks and the three-OS source CI passed. The MIT package 0.1.8 is published; Cxsun registry consumer verification is in progress. See TASK.md for current checkboxes and AUDIT.md for evidence. Earlier evidence remains historical.
