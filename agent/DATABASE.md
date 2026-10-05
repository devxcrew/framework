# Shared database and settings providers

Framework owns generic database and settings infrastructure.
It has no Platform or application dependency.

## Database

Import createDatabaseProvider, DatabaseExecution and DatabaseInfrastructureSchema from @devxcrew/framework.
Pass the environment and an optional migrations record and seed callback.
The application composes each owner's public migrations. Framework does not create identity or tenant mappings by default.

The provider offers explicit master execution and bounded leased connections.
It supports SQLite and MariaDB. Its generic schema type keeps owner queries typed.
Validated writes, bounded response DTOs, atomic transfers and resumable checkpoints share the same connection lifecycle.

Use backupConnection and checkConnectionBackup for driver-neutral recovery.
Use SqliteDataTransfer with an explicit owner table allowlist. Import destination policy belongs to the consumer.
Driver SQL compatibility uses bound values. MariaDB converts supported portable schema and aggregate expressions.

## Settings

Create a settings provider with defaults, a Zod schema and writableKeys.
Load merges defaults, the selected root's .env file and explicit overrides in that order.
The provider returns an immutable snapshot. It never modifies process.env.
Each provider keeps its own snapshot and serialized write queue.

Writes accept allowlisted keys only. They validate values and preserve unrelated settings and comments.
File replacement uses a unique temporary file. No public HTTP settings endpoint exists.
Callers must supply authentication and authorization before requesting an update.

## Development and verification

Run npm install and npm test in Framework.
Cxsun's packages:foundation command builds and packs Framework with Platform for local consumption.
The extracted APIs need a new registry release before other apps can install them from npm.

Generic engine and settings tests stay inside their owner folders.
Production account permissions, TLS, distributed network recovery and deployment load budgets require consumer evidence.

## Owner boundary

Framework has no dependency on Platform. Owner migrations and seed callbacks enter through public provider options.
