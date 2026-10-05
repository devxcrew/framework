# Framework task

## Release 0.1.9 complete

- Published `@devxcrew/framework@0.1.9` publicly with the `latest` tag.
- Installed 0.1.9 from npm in a clean consumer and imported both public entry points.
- `npm run release:check` passed with all 16 tests.
- Source release pushed as `3da2ff4`; task record update pushed as `9467b47`.

## Verified before publication

- `npm run release:check` passed with 16 tests.
- A clean temporary consumer installed the packed package and imported both public entry points.
- Six existing app manifests and lockfiles use the renamed `@devxcrew/framework@0.1.8` registry package.
- Cxsun package checks passed. Two generated registry consumers passed app verification and live SQLite checks.

## Scope

Keep optional services out until a consumer defines a need and public contract.
