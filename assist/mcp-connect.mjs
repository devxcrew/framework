import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

export async function connectGovernance(env, options = {}) {
  const url = new URL(env.MCP_SERVER_URL ?? "http://127.0.0.1:7310/mcp");
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid MCP server URL.");
  if (!env.MCP_SERVER_SECRET || !env.APP_ID || !env.APP_USER)
    throw new Error("Configure MCP_SERVER_SECRET, APP_ID, and APP_USER in .env.");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${env.MCP_SERVER_SECRET}`,
    "X-App-Id": env.APP_ID,
    "X-App-User": env.APP_USER
  };
  async function request(id, method, params) {
    const response = await fetch(url, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(options.timeout ?? 5000),
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
    });
    if (!response.ok) throw new Error(`MCP connection returned HTTP ${response.status}.`);
    const message = await response.json();
    if (message.error) throw new Error("MCP protocol request failed.");
    return message.result;
  }
  const initialized = await request(1, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: env.APP_ID, version: "1.0.0" }
  });
  headers["MCP-Protocol-Version"] = initialized.protocolVersion;
  const notification = await fetch(url, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(options.timeout ?? 5000),
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })
  });
  if (!notification.ok) throw new Error(`MCP initialization returned HTTP ${notification.status}.`);
  const result = await request(2, "tools/call", {
    name: "get_working_instructions",
    arguments: {}
  });
  if (result.isError) throw new Error("MCP instructions could not be retrieved.");
  return JSON.parse(result.content.find((item) => item.type === "text").text);
}

export async function runConnection(env, { strict = false, timeout } = {}) {
  try {
    const result = await connectGovernance(env, { timeout });
    console.info(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    console.info(
      `Governance guidance unavailable: ${error.message} Continue with AGENTS.md and assist/GOVERNANCE.md.`
    );
    return strict ? 1 : 0;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let local = {};
  try {
    local = parseEnv(readFileSync(resolve(".env"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT")
      console.info("Local environment file unavailable. Using process environment.");
  }
  process.exitCode = await runConnection(
    { ...local, ...process.env },
    { strict: process.argv.includes("--strict") }
  );
}
