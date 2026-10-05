# Framework plan

## Current release

Framework 0.1.9 adds owner-local validation, structured redacted logging, HTTP security, health checks, and a browser-safe API client.

## Release status

Version 0.1.9 is published to npm as `latest`. A clean registry consumer imported both public entry points, and all 16 release checks passed.

## Future services

Add database, cache, storage, queue, mail, webhook, and observability support when a consumer needs them. Keep business rules and schemas inside their owning modules. Identity, roles, and tenancy belong to Platform Core.
