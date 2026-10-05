import type { Kysely, Transaction } from "kysely";
import { z } from "zod";
import type { DatabaseSchema } from "./common/index.js";

const pageSchema = z.strictObject({
  page: z.number().int().min(1).max(1_000_000),
  pageSize: z.number().int().min(1).max(500),
});
const batchSchema = z.number().int().min(1).max(500);

export class DatabaseValidationError extends Error {
  readonly fields: Record<string, string[]>;
  constructor(error: z.ZodError) {
    super("Database input validation failed.");
    this.name = "DatabaseValidationError";
    this.fields = Object.create(null) as Record<string, string[]>;
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "input";
      (this.fields[key] ??= []).push("Invalid value.");
    }
  }
}

/** Transport and domain schemas remain owned by the calling module. */
export class DatabaseExecution<Schema = DatabaseSchema> {
  constructor(private readonly database: Kysely<Schema>) {}

  async persist<Input, Output>(
    schema: z.ZodType<Input>,
    input: unknown,
    write: (transaction: Transaction<Schema>, value: Input) => Promise<Output>,
  ): Promise<Output> {
    const value = validate(schema, input);
    return this.database
      .transaction()
      .execute((transaction) => write(transaction, value));
  }

  async fetch<Row>(
    input: unknown,
    read: (
      database: Kysely<Schema>,
      page: { limit: number; offset: number },
    ) => Promise<Row[]>,
    outputSchema: z.ZodType<Row>,
  ): Promise<{ data: Row[]; meta: { page: number; pageSize: number } }> {
    const { page, pageSize } = validate(pageSchema, input);
    const rows = await read(this.database, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    if (!Array.isArray(rows) || rows.length > pageSize)
      throw new Error("Repository exceeded the requested page size.");
    return {
      data: rows.map((row) => validate(outputSchema, row)),
      meta: { page, pageSize },
    };
  }

  /** One transaction: a late invalid row or failed write rolls back every batch. */
  async transfer<Row>(
    schema: z.ZodType<Row>,
    source: AsyncIterable<unknown> | Iterable<unknown>,
    write: (
      transaction: Transaction<Schema>,
      rows: readonly Row[],
      signal: AbortSignal,
    ) => Promise<void>,
    batchSize = 100,
    options: {
      signal?: AbortSignal;
      timeoutMs?: number;
      maxRows?: number;
    } = {},
  ): Promise<number> {
    validate(batchSchema, batchSize);
    const limits = validate(
      z.strictObject({
        timeoutMs: z.number().int().min(1).max(3_600_000).default(30_000),
        maxRows: z.number().int().min(1).max(100_000_000).default(1_000_000),
      }),
      { timeoutMs: options.timeoutMs, maxRows: options.maxRows },
    );
    const timeout = AbortSignal.timeout(limits.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;
    signal.throwIfAborted();
    return this.database.transaction().execute(async (transaction) => {
      let count = 0;
      let batch: Row[] = [];
      for await (const input of iterateTransfer(source, signal)) {
        if (count + batch.length >= limits.maxRows)
          throw new Error("Transfer row limit exceeded.");
        batch.push(validate(schema, input));
        if (batch.length === batchSize) {
          await write(transaction, batch, signal);
          signal.throwIfAborted();
          count += batch.length;
          batch = [];
        }
      }
      if (batch.length) {
        await write(transaction, batch, signal);
        signal.throwIfAborted();
        count += batch.length;
      }
      return count;
    });
  }
}

function validate<Value>(schema: z.ZodType<Value>, input: unknown): Value {
  const result = schema.safeParse(input);
  if (!result.success) throw new DatabaseValidationError(result.error);
  return result.data;
}

export async function* iterateTransfer(
  source: AsyncIterable<unknown> | Iterable<unknown>,
  signal: AbortSignal,
) {
  const iterator =
    Symbol.asyncIterator in source
      ? source[Symbol.asyncIterator]()
      : source[Symbol.iterator]();
  try {
    while (true) {
      signal.throwIfAborted();
      const next = await new Promise<IteratorResult<unknown>>(
        (resolve, reject) => {
          const abort = () => reject(signal.reason);
          signal.addEventListener("abort", abort, { once: true });
          Promise.resolve()
            .then(() => iterator.next())
            .then(resolve, reject)
            .finally(() => signal.removeEventListener("abort", abort));
        },
      );
      if (next.done) return;
      yield next.value;
    }
  } finally {
    // A stalled producer must not hold the transaction while its cleanup waits.
    Promise.resolve(iterator.return?.()).catch(() => undefined);
  }
}
