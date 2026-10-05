# Changelog

## Version State

Current version: 0.1.11

Release tag: v-0.1.11

Changelog label: v 0.1.11

## Unreleased

### 0.1.11 - 2026-10-05 19:21

- Move generic database and settings behavior into Framework and tenant behavior into Platform.
- Connect Cxsun through public exports and recorded development packages.
- Preserve migration history and current tenant mappings.
- Verify owner tests, app build, identity acceptance and live MariaDB fault checks.
- Verify a fresh offline Cxsun installation from recorded packages without shared source imports.
- Keep release versions unchanged. This work is not committed, pushed or published.

- Allow a production public URL to use a proxy port that differs from the Node listener.
- Keep environment file loading, events, queues, and storage in their current owners until a shared consumer needs a contract.

## v-0.1.11

### [v 0.1.11] 2026-10-05 7:35 pm - Extract reusable database and settings

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Framework owns database engines, validated execution, transactions, transfers, backups and settings. Release checks passed: 62 tests, build and package dry run. Migration history is preserved.

### [v 0.1.11] 2026-10-05 12:46 pm - Verify proxy configuration and app consumers

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Record production URL proxy-port support, 25 tests and fresh source consumer acceptance; npm publication remains separate.

### [v 0.1.11] 2026-10-05 10:22 am - Clarify typed route example

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Make the README route provider example compile in a clean TypeScript consumer.

## v-0.1.10

### [v 0.1.10] 2026-10-05 10:13 am - Complete modular framework contracts

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Add owner routes, typed providers, standard validation errors, bounded health checks, request diagnostics, and a shared rate limit adapter.

## v-0.1.9

### [v 0.1.9] 2026-10-05 8:30 am - Add modular runtime services

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Add server validation, redacted logging, HTTP security, health checks, and a browser API client.

## v-0.1.8

### [v 0.1.8] 2026-10-05 8:07 am - Publish shorter public package name

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Publish the MIT package under its shorter name with unchanged public APIs. Registry integrity matches the verified archive.

### Local completion preparation - 2026-10-04

- Reconcile task status and preserve historical evidence.
- Apply the user-selected MIT license to first-party code and packed metadata.
- Add or expand isolated Windows, Linux and macOS source CI.
- npm run release:check passed seven runtime tests, build, LF/version checks and a 13-file MIT package.
- Publication and external acceptance gates remain open.


### [v 0.1.8] 2026-10-04 5:00 pm - Deliver shared runtime foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Add public provider composition, bounded startup and shutdown, request cancellation, safe HTTP contracts and runtime regression checks.

## v-0.1.7

### [v 0.1.7] 2026-10-03 9:08 am - Prepare public npm package

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Publish under the devxcrew npm scope with explicit public exports, release verification, and consumer development instructions.

## v-0.1.6

### [v 0.1.6] 2026-10-03 8:58 am - Require audited cloud MCP guidance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Consolidate agent rules, document module-owned providers, validation and resource routing, and require authenticated cloud-only guidance through a standalone client.

#### Verification

- Passed npm run check: dependency order, aligned release metadata, and LF checks.
- Authenticated live MCP retrieval passed. Configured-secret and Git whitespace scans passed.

## v-0.1.5

### [v 0.1.5] 2026-10-03 8:38 am - Use live governance for shared documentation and rules

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Made the Cloudflare MCP endpoint the default client target and documented it in every repository
  README, AGENTS, and skills notes. Local guides remain editable source and offline fallback; only
  explicit local server/testing paths retain loopback URLs. Updated app manifests and verified cloud
  connections.

### [v 0.1.5] 2026-10-03 8:30 am - Connect Cloudflare-hosted governance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Configured the HTTPS governance endpoint at mcp.codexsun.com/mcp while keeping secrets in ignored
  environment files. Cloudflare Workers serves authenticated read-only MCP from a deployment
  snapshot; local listener remains optional and advisory offline behavior is preserved.

### [v 0.1.5] 2026-10-02 10:39 pm - Align isolated application foundation instructions

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Adapted the supplied new-app prompt to actual shared package paths, advisory MCP policy, isolated
  app ownership, provider composition, and three role-specific identity portal/desk contracts. Added
  audit/todo records. Application manifests describe current capabilities; real identity remains
  pending shared Platform Core. Preserved current changelog and environment contracts.

### [v 0.1.5] 2026-10-02 10:34 pm - Define resource routes and browser navigation contracts

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Set versioned Laravel-style API resources, browser-to-API mappings, validated URL filters and
  pagination, resource response contracts, and module-owned breadcrumbs that preserve list state.
  Create/edit APIs are optional read-only metadata extensions. Updated standards only; existing app
  routes and UI behavior are unchanged.

### [v 0.1.5] 2026-10-02 10:29 pm - Define frontend and backend validation standards

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Required module-owned TanStack Form with Zod for frontend forms and independent server-side Zod
  validation for untrusted input. Defined schema ownership, parsed controller input, safe field
  errors, domain checks, and queue payload validation. No application forms, endpoints, or package
  dependencies were changed.

### [v 0.1.5] 2026-10-02 10:27 pm - Define provider and controller module roles

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Replaced the module registration filename with <module>.provider.ts and defined injected public
  provider contracts as the communication boundary. Added optional module-owned controllers for
  request orchestration while keeping routes declarative and business rules in services. Applied
  matching frontend ownership without mandatory extra layers.

### [v 0.1.5] 2026-10-02 10:21 pm - Define strict module ownership standards

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Set modular-monolith and practical DDD rules for matching frontend/backend modules, public
  contracts, owner-local persistence and UI, optional events and retryable queues, and a practical
  700Ã¢â‚¬“900-line source limit. Referenced the CXApp app module layout without changing application
  runtime.

### [v 0.1.5] 2026-10-02 10:02 pm - Improve Markdown readability

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Simplified active documentation, removed repeated wording, and organized instructions into clear
  sections, paragraphs, lists, and tables. Formatted Markdown with consistent spacing and LF while
  preserving historical content and release metadata.

### [v 0.1.5] 2026-10-02 9:56 pm - Consolidate root agent instructions

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Merged root agent instructions into AGENTS.md, removed the duplicate AGENT.md, and updated active
  documentation, MCP metadata, and fallback references. Historical logs and archives remain
  unchanged.

### [v 0.1.5] 2026-10-02 9:41 pm - Central governance and repository agent layout

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Connected central governance and maintenance commands; preserved framework ownership and release
  history. Repository checks passed.

## v-0.1.4

### [v 0.1.4] 2026-10-02 9:30 pm - Central governance and repository agent layout

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Moved common guidance and audits to mcp-governance, preserved repository changelog history in
  agent/CHANGELOG.md, added local task and plan records, and wired centralized maintenance commands
  with legacy tools compatibility.

### [v 0.1.4] 2026-10-02 8:56 pm - Common MCP governance guidance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Added optional authenticated MCP instruction retrieval, connection settings, app identity, and
  common offline repository and UI guides. Governance remains advisory and does not gate startup or
  builds. Verified all six live MCP connections, four MCP protocol tests, common offline fallback,
  and repository checks. Cxsun production routes and UIUX builds passed.

## v-0.1.3

### [v 0.1.3] 2026-10-02 8:32 pm - Published npm tools integration

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Replaced the local tools archive with the pinned npm package @devxcrew/tools@0.1.3. Updated shared
  maintenance commands and removed the bundled tools archive. Passed dependency order, version
  alignment, and LF checks with the published tools package.

## v-0.1.2

### [v 0.1.2] 2026-10-02 8:26 pm - Shared tools maintenance wiring

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Connected shared version, changelog, line ending, and GitHub commands. Added tools checks to
  repository verification.

## v-0.1.1

### [v 0.1.1] 2026-10-02 8:26 pm - Shared tools maintenance wiring

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Connected shared version, changelog, line ending, and GitHub commands. Added tools checks to
  repository verification.

## v-0.1.0

### [v 0.1.0] 2026-10-02 8:15 pm - Initial framework repository

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Established the current shared package or developer gallery and public repository integration.

## Cloud-only governance — 2026-10-03

- Require live authenticated MCP guidance. Remove local guide fallback and sibling client imports.
- Connection commands fail when cloud guidance is unavailable or another endpoint is configured.

## Live MCP audit — 2026-10-03

- Enforced the cloud endpoint for direct client imports and validated instruction identity.
- Extended cloud request timeouts to 15 seconds and verified all live resources and tools.

## Live MCP audit — 2026-10-03

- Enforced the cloud endpoint for direct client imports and validated instruction identity.
- Extended cloud request timeouts to 15 seconds and verified all live resources and tools.

## npm package names — 2026-10-03

- Updated public imports, package manifests, local development commands, and common guidance.

## npm migration completion — 2026-10-03

- Passed: Cxsun installed both registry packages and records registry URLs and integrity hashes in its lockfile.
- Passed: UIUX typecheck and production build with the new UI package name. UIUX intentionally keeps its local source gallery dependency.
- Passed: Governance cloud checks, deployment, and authenticated connections from all six repositories.
- Passed: Tools source compatibility tests (21 tests). Tools npm publication was not part of this release.
- Untested: Real identity, RBAC, and tenancy; these remain outside this package migration.

## Unreleased startup completion - 2026-10-04

Add bounded startup, cancellation and reverse cleanup regression. Seven tests and release:check pass. Proposed release 0.1.8.

## Package name migration - 2026-10-05

Release: @devxcrew/framework 0.1.8. License: MIT.
The user approved publication under the shorter name. Public APIs stay unchanged.
Historical names and release records remain available.

Publication passed. Registry integrity matches the prepared MIT archive.

### Package migration verification - 2026-10-05

- Passed 7 tests, owner verification and applicable package checks.
- All six application lockfiles use exact Framework 0.1.8 and UI 0.2.0 registry artifacts.
- Two fresh registry apps passed 44 tests each, live SQLite and cross-app session denial.
- The gallery passed source and isolated registry verification with bundle budgets.
- Browser, real SMTP and production deployment acceptance remain separate.

### Package reference cleanup - 2026-10-05

- Remove superseded package identifiers from source, fixtures and current documents.
- Current release receipts use verified registry checksums for Framework and UI.
- Original publication records remain in Git history.
- No test suite, publication or deployment ran in this cleanup.

## Dependency alignment - 2026-10-05

- [x] Align consumed shared packages and common direct dependency versions.
- [x] Install dependencies with lifecycle scripts disabled.
- [x] Keep app dependency ownership and public peer ranges.
- [x] Exclude Veyrezio from this change.

Source version: 0.1.9. Published package archives retain their existing versions.
The baseline is recorded in projects/cxsun/agent/DEPENDENCY-BASELINE.json.


## Unreleased alignment - 2026-10-05

Release checks (25 tests) and fresh source consumers passed. Deployed proxy/TLS remains untested; source correction requires a new release version.

Authenticated live MCP verification passed. See the [alignment audit](D:/codexsun/projects/cxsun/agent/SHARED-ALIGNMENT.md). Version numbers remain unchanged. No release delivery was performed by this audit.
