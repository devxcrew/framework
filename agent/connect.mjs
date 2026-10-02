try {
  const { runCli } = await import("../../../shared/mcp-governance/client/connect.mjs");
  process.exitCode = await runCli();
} catch {
  console.info("Central governance client unavailable. Continue with AGENT.md and agent/SKILLS.md.");
  process.exitCode = process.argv.includes("--strict") ? 1 : 0;
}
