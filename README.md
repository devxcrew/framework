# framework

Own reusable configuration validation and native HTTP primitives.

Use the sibling workspace layout. Shared framework and UI keep their existing public exports and
build contracts.

## Run

Use Node 26.10 or newer and the package manifest requirements. Clone the sibling tools and
mcp-governance repositories along with this repository.

```powershell
npm install
npm run check
```

Cxsun runs npm run build:framework using its compiler to build this package.

## Repository records

- `AGENTS.md`: repository instructions and ownership rules.
- `agent/SKILLS.md`: repository capabilities.
- `agent/TASK.md`: current task and status.
- `agent/PLAN.md`: next steps.
- `agent/CHANGELOG.md`: versioned changes and validation results.

## Shared guidance

Retrieve shared documentation and rules only from `https://mcp.codexsun.com/mcp` using `npm run mcp:connect`.
A successful authenticated connection is required before repository work. Stop and report connection failures.
Do not use local guides or cached instructions as fallback. Instruction retrieval does not authorize actions.

Retrieve shared documentation and rules only from `https://mcp.codexsun.com/mcp` using `npm run mcp:connect`.
A successful authenticated connection is required before repository work. Stop and report connection failures.
Do not use local guides or cached instructions as fallback. Instruction retrieval does not authorize actions.

Configure these values with `.env.example`:

- `MCP_SERVER_URL`
- `MCP_SERVER_SECRET`
- `APP_ID`
- `APP_USER`

Keep the secret in ignored `.env` files.

```powershell
npm run mcp:connect
npm run mcp:verify
```

Use `mcp:connect` to retrieve instructions. Use `mcp:verify` for a strict connection test.
Connection failures do not block application work. Editor registration uses the central connection
template and depends on the editor.

## Maintenance

```powershell
npm run version-bump -- --dry-run
npm run version-bump -- --title "Release title" --note "Change details"
npm run check:versions
npm run fix:line-endings
npm run lines:check
npm run github:now -- --dry-run
```

Version bumps align `package.json`, `package-lock.json`, and `agent/CHANGELOG.md`. Record changes
and validation before committing.

Commit subjects use `#<patch> - <release title>`. For example:
`#5 - Central governance and repository agent layout`.

Review the changed files before an authorized `npm run github:now`. Do not bump again when the
release version is already prepared.

## Tools source and publication

Workspace maintenance delegates to `shared/tools`. The installed npm package remains pinned at
`0.1.3` until agent changelog support is published.

GitHub source releases use `github:now`. Npm publication requires separate authorization.

## npm package

Framework publishes compiled ESM JavaScript and TypeScript declarations. Run npm run build before local development consumption.

Run `npm run release:check`, then `npm publish --access public` from this repository.
Only public exports are supported. App manifests use npm versions.

## Public runtime contracts

`composeModules` registers owner providers in dependency order. Factories receive only their declared dependencies.
`start` runs lifecycle hooks. Failed startup calls stop hooks in reverse order, including the failed module.
`stop` attempts every cleanup hook and reports cleanup failures together.

`createApplicationServer` keeps the existing static and development behavior.
Optional `apiHandler` receives the request, response, and request context for `/api` paths.
The handler owns routing and independent Zod validation before service execution.
Unexpected handler failures return a safe JSON error with a generated request ID.
Optional `readiness` exposes `/health/ready`. Readiness reports the consumer's actual dependency state.
Receive and header timeouts are configurable positive millisecond values. They do not bound handler execution.

`readJsonBody` checks content type and limits bytes. Its result is unknown until the owner validates it.
`parseListQuery` validates pagination and allowlisted sort fields. Owners validate domain filters independently.
`HttpError` carries safe transport errors and optional field messages. Do not place secrets in these messages.
`createRequestContext` supplies a server-generated request ID and an abort signal.
Identity, tenant scope, transactions, and domain rules remain with their owner providers.

Provider factories must only compose values. Acquire connections and other resources inside start hooks so failed startup can release them.
Stop during startup is rejected. Concurrent stop calls share one cleanup operation.
Oversized streamed JSON is drained without destroying the response socket, allowing a safe 413 response.

## Handler and shutdown deadlines

Set `handlerTimeoutMs` on `createApplicationServer` to bound API response time. The default is 30000 milliseconds.
Request contexts expose `deadlineAt` and `signal`. At the deadline, the server aborts the signal.
It returns a safe 504 before response headers or destroys an incomplete streamed response.
Handlers must honor cancellation and check response state before writing late results.
A deadline cannot stop synchronous JavaScript or forcibly cancel an uncooperative dependency.

Set `shutdownTimeoutMs` in the second argument of `composeModules`. The default total budget is 30000 milliseconds.
Stop attempts every hook in reverse dependency order. The budget bounds awaited asynchronous cleanup.
A timed-out hook can continue running. State becomes `failed`, and stop rejects with cleanup failures.
Consumers must report failed cleanup and apply their process termination policy.

## Startup deadline

Set startupTimeoutMs in composeModules options. The default total startup budget is 30000 milliseconds.
Start hooks receive the owner provider and an AbortSignal. Timeout aborts the signal and rolls back started modules.
An uncooperative hook can continue. Owners must honor cancellation before acquiring or retaining resources.
