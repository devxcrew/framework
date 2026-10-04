# Current task

## Completion wave - 2026-10-04

- [x] Publish the approved MIT package 0.1.8 and verify its registry checksum against the prepared archive.

Source 0.1.8 includes bounded startup, cancellation, cleanup and seven runtime tests. Earlier no-test and no-deadline statements are historical. This wave documents module-owned transaction and retry responsibilities and adds three-OS CI.

- [x] Reconcile current status with the GitHub source release and latest owner audit.
- [x] Retrieve fresh authenticated cloud governance before this wave.
- [x] Apply the user-selected MIT license to first-party source, package metadata and lock metadata.
- [x] Record this wave's affected checks and accept only gates with direct evidence.

npm run release:check passed seven runtime tests, build, LF/version checks and a 13-file MIT package.
- [x] Prepare isolated CI coverage for the target Windows/Linux/macOS runtime.
- [x] Verify Windows/Linux/macOS CI: run 37202026913.


Use projects/cxsun/agent/REMAINING-WORK.md for ordered cross-owner dependencies.
Production deployment and real SMTP acceptance remain deferred. No pending external gate is marked complete.

## Prior records

<!-- foundation-checklist:start -->

## Numbered phase checklist

Master: [all foundation tasks](D:/codexsun/projects/cxsun/agent/CHECKLIST.md).

Updated: 2026-10-04. Checked steps have recorded evidence. External acceptance stays pending.

### Phase 01 - Baseline and ownership

- [x] **01.01 Audit Framework exports, lifecycle and ownership** - accepted. Owner: framework.
  - [x] 01.01.1 Authenticated audit and runtime gaps recorded.

### Phase 02 - Public contracts and release scope

- [x] **02.01 Define runtime and transport public contracts** - accepted. Owner: framework.
  - [x] 02.01.1 Provider composition, context, errors and parsing implemented.
  - [x] 02.01.2 Startup timeout contract and compatibility notes verified locally.

### Phase 03 - Backend and live persistence

- [ ] **03.01 Refine HTTP runtime, health and shutdown** - in-review. Owner: framework.
  - [x] 03.01.1 Seven runtime tests cover safe errors, readiness and deadlines.
  - [x] 03.01.2 Startup deadline, cancellation and failed-start cleanup verified locally.
  - [ ] 03.01.4 Production proxy/security and failure operations - deferred by user.
- [x] **03.02 Refine cancellation and concurrency primitives** - accepted. Owner: framework.
  - [x] 03.02.1 Request cancellation and bounded lifecycle behavior tested.
  - [x] 03.02.2 Accept consumer transaction, idempotency and cancellation responsibilities.
- [x] **03.03 Provide transport for accepted asynchronous needs** - accepted for current local scope. Owner: framework.
  - [x] 03.03.1 Synchronous ownership retained where no asynchronous consumer is required.
  - [x] 03.03.2 No current consumer requires asynchronous transport. Explicit not-required decision recorded.

### Phase 06 - Verification and operations

- [ ] **06.01 Verify runtime consumers and performance** - in-review. Owner: framework.
  - [x] 06.01.1 Seven HTTP/lifecycle tests and Cxsun integration checks pass.
  - [x] 06.01.2 Startup fault and 30-second default lifecycle budget verified.
  - [x] 06.01.4 Independent registry consumer - coordinated release gate.
  - [ ] 06.01.5 Production performance and proxy operations - deferred by user.

<!-- foundation-checklist:end -->

## Earlier task records

Date: 2026-10-04
Scope: review implemented runtime, revise owner acceptance states and audit remaining release gates.

## Current status - 2026-10-04

Passed: authenticated MCP connection and `npm run release:check`, including all six runtime tests.
Passed: installed Tools maintenance, TypeScript build, version alignment, LF check and package dry run.
01.01: accepted for the reviewed baseline. 02.01, 03.01 and 06.01: in-review for implemented subsets.
03.02: planned pending concrete consumer contracts. 03.03: conditional on an accepted asynchronous consumer.
Open: startup timeout policy, performance budgets, production proxy/security and independent released consumer evidence.
The initial status table below records history. It does not describe current implementation.
No source implementation, publication, migration, commit or push occurred in this review.

## Initial status - historical

Verified 2026-10-04: release:check passed dependency order, version 0.1.7, line endings, TypeScript build, and package dry run. Source exports readApplicationConfig and createApplicationServer. API requests return 404 unless a development handler takes ownership. No framework test script or dedicated test files exist. Configuration is accepted by the server but is not applied there. Maintenance scripts still depend on a sibling MCP Governance checkout. README has stale Cxsun build and connection-failure statements.

| ID    | State     | Evidence or next action                |
| ----- | --------- | -------------------------------------- |
| 01.01 | in-review | Acceptance and dependencies in PLAN.md |
| 02.01 | planned   | Acceptance and dependencies in PLAN.md |
| 03.01 | planned   | Acceptance and dependencies in PLAN.md |
| 03.02 | planned   | Acceptance and dependencies in PLAN.md |
| 03.03 | planned   | Acceptance and dependencies in PLAN.md |
| 06.01 | planned   | Acceptance and dependencies in PLAN.md |

Phase 01 awaits coordinator review. Later tasks require contract agreement and implementation verification.
No runtime implementation, publication, version bump, commit, or push was performed.

## Previous task history

# Current task

Set strict module-owned architecture instructions for all repositories.

## Status

Agent notes and central MCP guidance define modular monoliths, practical DDD, and matching frontend/backend ownership.
Events and queues are optional capabilities. The source-file guideline is 700–900 lines.
No application runtime refactor or new infrastructure was added.

## Release 0.1.6 — 2026-10-03

- Passed npm run check: dependency order, aligned release metadata, and LF checks.
- Passed authenticated live MCP connection, release metadata, LF, and configured-secret scans.
- Prepared commit subject: #6 - Require audited cloud MCP guidance.

## npm package migration — 2026-10-03

- Prepare public `@devxcrew/core-framework` and `@devxcrew/react-ui` version 0.1.7.
- Project apps use npm dependencies. Explicit local snapshots support side-by-side development.
- Passed package release checks, local package consumption, Cxsun verification, and UIUX verification.
- The original names were blocked by npm's unpublished-name hold. The user selected new package names.

## Publication with new names

- User selected @devxcrew/core-framework and @devxcrew/react-ui to avoid the old-name hold.
- Both @devxcrew/core-framework and @devxcrew/react-ui 0.1.7 are published and visible in the npm registry.
- Registry installation passed. Cxsun lock entries contain npm tarball URLs and integrity hashes. Cxsun clean installation and final app verification are recorded in the application audit.

## Framework roadmap planning — 2026-10-03

- Completed: expanded agent/PLAN.md with MVP modules, standard services, advanced options, ownership, runtime parameters, phases, and acceptance gates.
- Passed: authenticated npm run mcp:connect and official NestJS, Next.js, Frappe, and Laravel documentation review.
- Passed: npm run check for dependency order, version alignment, and LF checks.
- Scope: documentation only. Proposed capabilities remain unimplemented and runtime acceptance tests remain untested.

## Foundation runtime implementation - 2026-10-04

02.01 is in-review. Public exports now provide module composition, HTTP request context, safe errors, JSON parsing, and list query parsing.
03.01 is in-review for the implemented subset. The server accepts an API handler, readiness callback, and validated receive/header timeouts.
Static file serving checks resolved paths to prevent symlink escape.
03.02 remains planned for transaction and stale-write integration. Database owners retain transaction and idempotency decisions.
03.03 remains planned until an accepted asynchronous consumer requires transport.

Passed: authenticated cloud MCP retrieval, TypeScript build, and three runtime tests with actual localhost HTTP requests.
Passed: release:check, including dependency order, version alignment, line endings, and package dry run.
HTTP tests cover malformed JSON, unsupported content types, oversized payloads, safe internal errors, unique request IDs, and readiness changes.
Lifecycle tests cover dependency order, duplicates, missing dependencies, and cleanup after failed startup.
No persistence was introduced. File-backed SQLite acceptance remains with Platform and Cxsun.
Receive timeouts do not enforce a deadline on an asynchronous handler. Handler cancellation follows aborted client requests.
Consumer integration, bounded shutdown, CORS/proxy/CSRF policy, and performance budgets remain required review work.
No publication, version bump, commit, or deployment was performed.

Review follow-up: four runtime tests now pass, including chunked oversized JSON returning 413 and concurrent lifecycle guards.
Provider factories must defer resource acquisition until start hooks. Concurrent shutdown runs cleanup once.

## Framework deadline verification - 2026-10-04

06.01 is in-review for bounded handler response and shutdown cleanup behavior.
Added handlerTimeoutMs, request deadlineAt, and cancellation at the response deadline.
Added composeModules shutdownTimeoutMs with shared total cleanup budget and failed state on cleanup timeout.
Six runtime tests pass. Real HTTP verification includes an unresponsive handler returning safe 504 with an aborted signal.
Lifecycle verification includes unresponsive shutdown, bounded rejection, remaining hooks attempted, and persistent failed state.
No claim covers performance budgets, Cxsun consumer acceptance, process termination, or synchronous JavaScript preemption.

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
## Workspace GitHub release - 2026-10-04

Release title: Deliver shared runtime foundation.
Add public provider composition, bounded startup and shutdown, request cancellation, safe HTTP contracts and runtime regression checks.
Update version records, review release checks, then commit and push the current owner branch.
Preserve existing task history and incomplete acceptance gates.


## Registry consumer acceptance - 2026-10-04

Two independent generated apps passed exact registry installation, application verification, module boundaries and live SQLite checks. Cross-app session denial passed. Cxsun three-OS CI passed in run 37204145628. See projects/cxsun/agent/GENERATED-CONSUMERS.json and RELEASE-PACKAGES.json. Browser acceptance and future version upgrade rehearsal remain separate.
