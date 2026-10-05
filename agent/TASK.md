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

## Shared foundation extraction - 2026-10-05 19:21

Move generic Kysely database infrastructure and settings file handling into module-owned Framework folders.
Expose typed public providers, driver-neutral backups and streamed imports. Keep app schemas, migration order and seeds in callers.
Settings providers keep isolated snapshots, preserve unrelated values and serialize allowlisted file writes.
Framework has no Platform dependency. All canonical database and settings files are present.

Passed: 25 existing Framework tests and 37 database/settings tests, TypeScript build, tooling and package dry run.
Source SQL compatibility supports owner column names without identity-specific aggregation rules.
Cxsun consumes the packed exports. Its live MariaDB suite and tenant backup restore passed through these contracts.

No version change, commit, push or npm publication was performed. Production TLS, privilege policy and distributed network acceptance remain untested.

### Final extraction evidence - 2026-10-05 19:23

Passed: Cxsun test:foundation:standalone completed offline npm ci in a new fixture.
The fixture uses recorded vendor artifacts and the secret-free environment example.
It passed tooling, lint, TypeScript, 48 app tests, production build, frontend smoke and compiled three-portal identity/RBAC acceptance.
The default suite skipped one gated MariaDB test. The separate live MariaDB command passed.
No sibling source import or linked shared runtime was required in the standalone consumer.

Passed: Framework 62 tests and Platform 27 tests.
Canonical database, settings and tenant files are present. All reviewed owner files remain below 700 lines.
Package lock integrity, dependency order, version alignment, LF checks and git diff --check passed.
Tenant backup and isolated restore checked four infrastructure tables through public package exports.

Partial: existing-account live login needs verification credentials. Server startup and master/tenant readiness passed.
Production TLS, privilege policy and distributed network recovery remain untested.
Versions remain Framework 0.1.11, Platform 0.1.6 and Cxsun 0.2.3 with unreleased source changes.
No commit, push or package publication was performed.

## Source delivery - 2026-10-05 19:34

Extract reusable database and settings.

Framework owns database engines, validated execution, transactions, transfers, backups and settings. Release checks passed: 62 tests, build and package dry run. Migration history is preserved.

Live authenticated governance connected. Local release checks passed. Commit and push authorized through github:now. Versions remain unchanged; npm publication is pending. GitHub Actions results must be checked after push. Secrets, runtime storage and caches are excluded.

## npm release audit - 2026-10-05

- [x] Retrieve authenticated live governance.
- [x] Review public exports, dependency ownership and release artifact scope.
- [x] Run owner release checks: 62 tests passed.
- [x] Verify npm latest and archive checksums.
- [x] Complete the isolated five-package consumer verification.

Source version: 0.1.12. SMTP and deployment acceptance remain deferred.
Tools 0.1.9 already matches its published archive and needs no republish.

Fresh registry-only backend consumer passed public imports, owner migrations, persisted SQLite writes and database reopen.

Registry-only installation of all five packages passed. Public runtime imports, TypeScript/React UI imports and the installed Tools CLI passed.
Production dependency audit reports zero vulnerabilities. Full runtime deployment and real SMTP remain deferred.
