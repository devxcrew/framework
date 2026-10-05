import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new Error("Invalid HTTP error status.");
    }
  }
}

export function createRequestContext(
  request: IncomingMessage,
  deadlineAt?: number,
) {
  const controller = new AbortController();
  request.once("aborted", () => controller.abort());
  return {
    requestId: randomUUID(),
    signal: controller.signal,
    deadlineAt,
    abort: (reason?: unknown) => controller.abort(reason),
  };
}

export function writeJsonError(
  response: ServerResponse,
  error: unknown,
  requestId: string,
) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  const known = error instanceof HttpError;
  response.writeHead(known ? error.status : 500, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Request-ID": requestId,
  });
  response.end(
    JSON.stringify({
      error: {
        code: known ? error.code : "internal_error",
        message: known ? error.message : "Unable to complete the request.",
        ...(known && error.fields ? { fields: error.fields } : {}),
      },
      requestId,
      ...(known && error.status === 422 && error.fields
        ? { message: error.message, errors: error.fields }
        : {}),
    }),
  );
}

export type ApiMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRoute {
  method: ApiMethod;
  path: string;
  handler(
    request: IncomingMessage,
    response: ServerResponse,
    context: ReturnType<typeof createRequestContext>,
    params: Readonly<Record<string, string>>,
  ): void | Promise<void>;
}

export interface ApiRouteProvider {
  routes: readonly ApiRoute[];
}

interface RegisteredRoute {
  route: ApiRoute;
  segments: readonly string[];
  staticCount: number;
}

export function createApiRouter(providers: readonly ApiRouteProvider[]) {
  const registered = providers
    .flatMap((provider) => provider.routes)
    .map(registerRoute);
  const keys = new Set<string>();
  for (const entry of registered) {
    const key = `${entry.route.method} ${entry.segments.map((part) => (part.startsWith(":") ? ":" : part)).join("/")}`;
    if (keys.has(key))
      throw new Error(`Duplicate API route: ${entry.route.path}`);
    keys.add(key);
  }
  registered.sort((left, right) => right.staticCount - left.staticCount);

  return (
    request: IncomingMessage,
    response: ServerResponse,
    context: ReturnType<typeof createRequestContext>,
  ) => {
    let segments: string[];
    try {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      segments = pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (segments.some((part) => part.includes("/") || part.includes("\\")))
        throw new Error("Encoded path separator.");
    } catch {
      throw new HttpError(400, "invalid_url", "Invalid URL.");
    }
    const matching = registered
      .map((entry) => ({ entry, params: matchRoute(entry.segments, segments) }))
      .filter(({ params }) => params !== undefined);
    const mostSpecific = matching.filter(
      ({ entry }) => entry.staticCount === matching[0]?.entry.staticCount,
    );
    const selected = mostSpecific.find(
      ({ entry }) => entry.route.method === request.method,
    );
    if (selected)
      return selected.entry.route.handler(
        request,
        response,
        context,
        selected.params!,
      );
    if (mostSpecific.length) {
      response.setHeader(
        "Allow",
        [...new Set(mostSpecific.map(({ entry }) => entry.route.method))].join(
          ", ",
        ),
      );
      throw new HttpError(405, "method_not_allowed", "Method not allowed.");
    }
    throw new HttpError(404, "not_found", "Resource not found.");
  };
}

function registerRoute(route: ApiRoute): RegisteredRoute {
  if (
    !["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(route.method) ||
    typeof route.handler !== "function"
  )
    throw new Error(`Invalid API route: ${route.path}`);
  if (
    !route.path.startsWith("/api/v1/") ||
    route.path.endsWith("/") ||
    route.path.includes("?")
  )
    throw new Error(`Invalid API route: ${route.path}`);
  const segments = route.path.split("/").filter(Boolean);
  for (const part of segments) {
    if (part.startsWith(":")) {
      if (!/^:[A-Za-z_][A-Za-z0-9_]*$/.test(part))
        throw new Error(`Invalid API route: ${route.path}`);
    } else if (!/^[A-Za-z0-9_-]+$/.test(part)) {
      throw new Error(`Invalid API route: ${route.path}`);
    }
  }
  return {
    route,
    segments,
    staticCount: segments.filter((part) => !part.startsWith(":")).length,
  };
}

function matchRoute(pattern: readonly string[], path: readonly string[]) {
  if (pattern.length !== path.length) return undefined;
  const params: Record<string, string> = Object.create(null);
  for (let index = 0; index < pattern.length; index++) {
    const part = pattern[index];
    if (part.startsWith(":")) params[part.slice(1)] = path[index];
    else if (part !== path[index]) return undefined;
  }
  return params;
}

export function parseListQuery(
  search: URLSearchParams,
  allowedSorts: readonly string[],
  defaults = { perPage: 20, maxPerPage: 100 },
) {
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
  if (
    (sort !== undefined && !allowedSorts.includes(sort)) ||
    !["asc", "desc"].includes(direction)
  ) {
    throw new HttpError(422, "invalid_query", "Invalid sorting.");
  }
  const page = integer("page", 1, 1_000_000);
  const perPage = integer("per_page", defaults.perPage, defaults.maxPerPage);
  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
    sort,
    direction: direction as "asc" | "desc",
  };
}

export async function readJsonBody(
  request: IncomingMessage,
  maxBytes = 1_048_576,
): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new Error("Invalid body limit.");
  if (
    request.headers["content-type"]?.split(";")[0].trim() !== "application/json"
  ) {
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
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid_json", "Invalid JSON body.");
  }
}
