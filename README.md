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
