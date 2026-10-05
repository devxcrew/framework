# Framework task

## Release 0.1.9

- [ ] Publish `@devxcrew/framework@0.1.9` with npm two-factor authentication.
- [ ] Install the published package and verify the main and browser client exports.
- [ ] Commit and push the reviewed source release.

## Verified before publication

- `npm run release:check` passed with 16 tests.
- A clean temporary consumer installed the packed package and imported both public entry points.
- Six existing app manifests and lockfiles use the renamed `@devxcrew/framework@0.1.8` registry package.
- Cxsun package checks passed. Two generated registry consumers passed app verification and live SQLite checks.

## Scope

Keep optional services out until a consumer defines a need and public contract.
