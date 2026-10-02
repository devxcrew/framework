# Shared MCP guidance

Common developer guidance is available at http://127.0.0.1:7310/mcp. The service lives in shared/mcp-governance.

Run npm run mcp:connect to retrieve working instructions for this repository. Offline guidance is in assist/governance. These commands do not gate startup, builds, checks, or development. Use npm run mcp:verify for an explicit strict connection test.

Set MCP_SERVER_URL, MCP_SERVER_SECRET, APP_ID, and APP_USER in ignored .env. Never expose the secret through VITE variables or frontend imports. APP_ID identifies this repository. APP_USER is developer context, not business authentication.

An HTTP MCP client uses Authorization: Bearer <MCP_SERVER_SECRET>, X-App-Id: <APP_ID>, and X-App-User: <APP_USER>. See assist/mcp.json for the connection template. Expand environment placeholders using your client configuration. Adding these files does not automatically register the server in an editor.
