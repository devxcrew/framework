# Add another app

Create an app-owned repository and README. Link framework and UI through their public exports. Install the pinned npm tools package as a devDependency. Define app startup paths in .devxcrew-tools.json.

Configure APP_NAME, APP_PORT, APP_URL, APP_MODE, and APP_HOST. For governance, configure MCP_SERVER_URL, MCP_SERVER_SECRET, APP_ID, and APP_USER in ignored .env files. Use the optional mcp:connect command to retrieve instructions. Use mcp:verify for an explicit strict connection test. Neither command is a startup, build, or CI prerequisite.

Cxsun currently provides home -> preview login -> desk. Authentication, database, tenant management, and business APIs are not connected. Decide the identity provider and tenant isolation model before connecting business data. Single-client deployments use one organization. Multi-tenant deployments resolve organization membership on the server.
