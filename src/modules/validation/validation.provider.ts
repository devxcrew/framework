import { z } from "zod";
import { HttpError } from "../http/http.provider.js";

export interface ValidationProvider {
  parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T>;
}

export function createValidationProvider(): ValidationProvider {
  return { parse: parseWithSchema };
}

export function parseWithSchema<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields: Record<string, string[]> = Object.create(null);
    for (const issue of result.error.issues) {
      const path = issue.path.length
        ? issue.path.map(String).join(".")
        : "_form";
      (fields[path] ??= []).push(issue.message);
    }
    throw new HttpError(
      422,
      "validation_failed",
      "The submitted data is invalid.",
      Object.fromEntries(Object.entries(fields)),
    );
  }
  return result.data;
}
