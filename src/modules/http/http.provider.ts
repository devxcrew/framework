import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string,
    message: string, public readonly fields?: Record<string, string[]>) {
    super(message);
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new Error("Invalid HTTP error status.");
    }
  }
}

export function createRequestContext(request: IncomingMessage, deadlineAt?: number) {
  const controller = new AbortController();
  request.once("aborted", () => controller.abort());
  return { requestId: randomUUID(), signal: controller.signal, deadlineAt,
    abort: (reason?: unknown) => controller.abort(reason) };
}

export function writeJsonError(response: ServerResponse, error: unknown, requestId: string) {
  if (response.headersSent) { response.destroy(); return; }
  const known = error instanceof HttpError;
  response.writeHead(known ? error.status : 500, {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Request-ID": requestId,
  });
  response.end(JSON.stringify({ error: {
    code: known ? error.code : "internal_error",
    message: known ? error.message : "Unable to complete the request.",
    ...(known && error.fields ? { fields: error.fields } : {}),
  }, requestId }));
}

export function parseListQuery(search: URLSearchParams, allowedSorts: readonly string[], defaults = { perPage: 20, maxPerPage: 100 }) {
  const integer = (key: string, fallback: number, max: number) => {
    const raw = search.get(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > max) {
      throw new HttpError(422, "invalid_query", `Invalid ${key}.`);
    }
    return Number(raw);
  };
  const sort = search.get("sort") ?? allowedSorts[0];
  const direction = search.get("direction") ?? "asc";
  if ((sort !== undefined && !allowedSorts.includes(sort)) || !["asc", "desc"].includes(direction)) {
    throw new HttpError(422, "invalid_query", "Invalid sorting.");
  }
  const page = integer("page", 1, 1_000_000);
  const perPage = integer("per_page", defaults.perPage, defaults.maxPerPage);
  return { page, perPage, offset: (page - 1) * perPage, sort, direction: direction as "asc" | "desc" };
}

export async function readJsonBody(request: IncomingMessage, maxBytes = 1_048_576): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid body limit.");
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
    throw new HttpError(415, "unsupported_media_type", "Use application/json.");
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) {
      request.resume();
      throw new HttpError(413, "body_too_large", "Request body is too large.");
    }
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "invalid_json", "Invalid JSON body."); }
}
