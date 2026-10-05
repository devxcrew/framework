import type { Kysely, Transaction } from "kysely";
import { z } from "zod";
import type { DatabaseSchema } from "./common/index.js";
import {
  iterateTransfer,
  DatabaseValidationError,
} from "./database.execution.js";

/** Explicit chunk commits; data and checkpoint always commit together. */
export class ResumableTransfer<Schema extends DatabaseSchema = DatabaseSchema> {
  constructor(private readonly database: Kysely<Schema>) {}
  async run<Row>(
    input: { jobId: string; sourceSha256: string; batchSize?: number },
    schema: z.ZodType<Row>,
    source: (cursor: number) => AsyncIterable<unknown> | Iterable<unknown>,
    write: (
      transaction: Transaction<Schema>,
      rows: readonly Row[],
    ) => Promise<void>,
    signal?: AbortSignal,
  ) {
    const job = z
      .strictObject({
        jobId: z.string().min(1).max(255),
        sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
        batchSize: z.number().int().min(1).max(500).default(100),
      })
      .parse(input);
    signal?.throwIfAborted();
    const checkpoints = this.database as unknown as Kysely<DatabaseSchema>;
    await checkpoints
      .insertInto("transfer_checkpoints")
      .values({ job_id: job.jobId, source_sha256: job.sourceSha256, cursor: 0 })
      .onConflict((conflict) => conflict.column("job_id").doNothing())
      .execute();
    const checkpoint = await checkpoints
      .selectFrom("transfer_checkpoints")
      .selectAll()
      .where("job_id", "=", job.jobId)
      .executeTakeFirstOrThrow();
    if (checkpoint.source_sha256 !== job.sourceSha256)
      throw new Error("Transfer source fingerprint changed.");
    let cursor = Number(checkpoint.cursor);
    let version = Number(checkpoint.version);
    let committed = 0;
    let batch: Row[] = [];
    const flush = async () => {
      const rows = batch;
      await this.database.transaction().execute(async (transaction) => {
        signal?.throwIfAborted();
        const checkpointTransaction =
          transaction as unknown as Transaction<DatabaseSchema>;
        const current = await checkpointTransaction
          .selectFrom("transfer_checkpoints")
          .selectAll()
          .where("job_id", "=", job.jobId)
          .executeTakeFirstOrThrow();
        if (
          Number(current.cursor) !== cursor ||
          Number(current.version) !== version ||
          current.source_sha256 !== job.sourceSha256
        )
          throw new Error(
            "Transfer checkpoint changed; resume from persisted state.",
          );
        await write(transaction, rows);
        signal?.throwIfAborted();
        const result = await checkpointTransaction
          .updateTable("transfer_checkpoints")
          .set({ cursor: cursor + rows.length, version: version + 1 })
          .where("job_id", "=", job.jobId)
          .where("version", "=", version)
          .where("cursor", "=", cursor)
          .executeTakeFirst();
        if (result.numUpdatedRows !== 1n)
          throw new Error("Concurrent transfer checkpoint update.");
      });
      cursor += rows.length;
      committed += rows.length;
      version++;
      batch = [];
    };
    for await (const row of iterateTransfer(
      source(cursor),
      signal ?? AbortSignal.timeout(300_000),
    )) {
      signal?.throwIfAborted();
      const parsed = schema.safeParse(row);
      if (!parsed.success) throw new DatabaseValidationError(parsed.error);
      batch.push(parsed.data);
      if (batch.length === job.batchSize) await flush();
    }
    if (batch.length) await flush();
    return { cursor, committed, jobId: job.jobId };
  }
}
