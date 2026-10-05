import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { HttpError } from "../../../dist/modules/http/http.provider.js";
import {
  createValidationProvider,
  parseWithSchema,
} from "../../../dist/modules/validation/validation.provider.js";

test("validation parses input and returns safe field errors", () => {
  const schema = z.object({ name: z.string().min(2), count: z.number().int() });
  assert.deepEqual(parseWithSchema(schema, { name: "Ada", count: 2 }), {
    name: "Ada",
    count: 2,
  });
  assert.throws(
    () => createValidationProvider().parse(schema, { name: "A", count: "two" }),
    (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 422);
      assert.equal(error.code, "validation_failed");
      assert.deepEqual(Object.keys(error.fields).sort(), ["count", "name"]);
      return true;
    },
  );
});
