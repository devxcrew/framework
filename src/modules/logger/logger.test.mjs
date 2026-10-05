import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../../../dist/modules/logger/logger.provider.js";

test("logger filters levels, adds request context, and redacts secrets", () => {
  const records = [];
  const logger = createLogger({
    level: "info",
    context: { requestId: "req-1" },
    sink: (record) => records.push(record),
  });
  logger.debug("hidden");
  logger.info("created", {
    password: "p@ss",
    headers: { authorization: "Bearer top-secret" },
    url: "https://user:pass@example.test/path?access_token=abc",
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].requestId, "req-1");
  assert.equal(records[0].password, "[REDACTED]");
  assert.doesNotMatch(
    JSON.stringify(records[0]),
    /p@ss|top-secret|user:pass|access_token=abc/,
  );
});
