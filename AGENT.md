# framework agent notes

Own reusable configuration validation and native HTTP primitives.

## Repository-specific rules

## Working instructions

Read agent/SKILLS.md, agent/TASK.md, agent/PLAN.md, and agent/CHANGELOG.md before work. Common standards live only in shared/mcp-governance/assist/guides. Use npm run mcp:connect for current instructions. If MCP is offline, read this AGENT.md and the central files when available. Continue development without a connection gate.

Use npm run version-bump with a title and note for a release. Maintain agent/CHANGELOG.md and preserve history. Use npm run fix:line-endings and npm run lines:check. Run npm run check:versions and the repository checks before npm run github:now. Review its changed files and commit subject. The subject uses #<patch> - <release title>. Commit, push, and publish only within user authorization.

Keep MCP_SERVER_SECRET in ignored .env and outside frontend code. App ID and app user are developer context only.
