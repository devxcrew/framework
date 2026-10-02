# Code standard

Keep functions focused and files below 300 lines when practical. Use TypeScript types, clear names, and small modules. Add abstractions only for repeated concrete uses. Keep comments short and explain reasons. Use argument-based child processes. Never construct shell commands from user text.

Keep secrets in ignored environment files. Expose only explicit public frontend configuration. Validate request input and enforce permissions on the server. Frontend navigation flags do not authorize data access. Scope every business query to its authenticated organization.

Use LF for source files and preserve binary files. Run the repository check command. Add tests for meaningful behavior and defects. Respect repository-specific AGENTS.md rules and direct user instructions. Guidance is advisory.
