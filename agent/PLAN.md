# Framework plan

## Current base

Framework 0.1.9 adds server validation, structured redacted logs, configurable HTTP security, dependency health checks, and a browser-safe API client.

## Release steps

1. Publish 0.1.9 after npm two-factor authentication.
2. Install 0.1.9 from npm and verify its public entry points.
3. Commit and push the reviewed source release.

## Later services

Add database, cache, storage, queue, mail, webhook, or observability services only when a consumer needs them.
Keep business code and schemas in their owning modules. Keep identity and tenancy in Platform Core.
