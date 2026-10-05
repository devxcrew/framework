import { createServer, type RequestListener } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { ApplicationConfig } from "../runtime/config.js";
import {
  createRequestContext,
  writeJsonError,
  HttpError,
} from "../modules/http/http.provider.js";
import {
  createHttpSecurityProvider,
  type HttpSecurityOptions,
} from "../modules/http/http-security.provider.js";
import type { Logger } from "../modules/logger/logger.provider.js";

export interface RequestCompletion {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  aborted: boolean;
}

export interface ApplicationServerOptions {
  config: ApplicationConfig;
  frontendDirectory: string;
  developmentHandler?: RequestListener;
  apiHandler?: (
    request: import("node:http").IncomingMessage,
    response: import("node:http").ServerResponse,
    context: ReturnType<typeof createRequestContext>,
  ) => void | Promise<void>;
  readiness?: () => boolean | Promise<boolean>;
  readinessTimeoutMs?: number;
  security?: HttpSecurityOptions;
  logger?: Logger;
  onRequestComplete?: (event: RequestCompletion) => void;
  requestTimeoutMs?: number;
  headersTimeoutMs?: number;
  handlerTimeoutMs?: number;
}
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export function createApplicationServer(options: ApplicationServerOptions) {
  const handlerTimeoutMs = positiveTimeout(options.handlerTimeoutMs ?? 30_000);
  const readinessTimeoutMs = positiveTimeout(
    options.readinessTimeoutMs ?? 2_000,
  );
  const security = createHttpSecurityProvider(options.security);
  const server = createServer((request, response) => {
    const isApi = /^\/api(?:\/|\?|$)/.test(request.url ?? "");
    const context = createRequestContext(request);
    response.setHeader("X-Request-ID", context.requestId);
    reportRequest(request, response, context.requestId, options);
    void security
      .handleAsync(request, response)
      .then((handled) => {
        if (!handled && !response.destroyed)
          serveRequest(
            request,
            response,
            context,
            isApi,
            options,
            handlerTimeoutMs,
            readinessTimeoutMs,
          );
      })
      .catch(() => {
        if (!response.writableEnded && !response.destroyed)
          writeJsonError(
            response,
            new HttpError(
              503,
              "security_unavailable",
              "Request checks are unavailable.",
            ),
            context.requestId,
          );
      });
  });
  server.requestTimeout = positiveTimeout(options.requestTimeoutMs ?? 30_000);
  server.headersTimeout = positiveTimeout(options.headersTimeoutMs ?? 10_000);
  return server;
}

function serveRequest(
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
  context: ReturnType<typeof createRequestContext>,
  isApi: boolean,
  options: ApplicationServerOptions,
  handlerTimeoutMs: number,
  readinessTimeoutMs: number,
) {
  if (options.readiness && request.url === "/health/ready") {
    void serveReadiness(
      request,
      response,
      options.readiness,
      readinessTimeoutMs,
    );
    return;
  }
  if (options.apiHandler && isApi) {
    context.deadlineAt = Date.now() + handlerTimeoutMs;
    const deadline = setTimeout(() => {
      const error = new HttpError(
        504,
        "request_timeout",
        "Request deadline exceeded.",
      );
      context.abort(error);
      if (!response.writableEnded && !response.destroyed)
        writeJsonError(response, error, context.requestId);
    }, handlerTimeoutMs);
    response.once("finish", () => clearTimeout(deadline));
    response.once("close", () => clearTimeout(deadline));
    response.once("close", () => {
      if (!response.writableFinished) request.emit("aborted");
    });
    void Promise.resolve()
      .then(() => options.apiHandler!(request, response, context))
      .catch((error) => {
        if (!response.writableEnded && !response.destroyed)
          writeJsonError(response, error, context.requestId);
      });
    return;
  }
  if (options.developmentHandler) {
    options.developmentHandler(request, response);
    return;
  }
  void serveFrontend(
    options.frontendDirectory,
    request.url || "/",
    request.method || "GET",
    response,
  );
}

async function serveReadiness(
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
  readiness: () => boolean | Promise<boolean>,
  timeoutMs: number,
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ready = false;
  try {
    ready = await Promise.race([
      Promise.resolve().then(readiness),
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } catch {
    ready = false;
  } finally {
    clearTimeout(timer);
  }
  if (response.destroyed) return;
  response.writeHead(ready ? 200 : 503, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(
    request.method === "HEAD" ? undefined : JSON.stringify({ ready }),
  );
}

function reportRequest(
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
  requestId: string,
  options: ApplicationServerOptions,
) {
  if (!options.logger && !options.onRequestComplete) return;
  const startedAt = Date.now();
  let reported = false;
  const report = () => {
    if (reported) return;
    reported = true;
    const event: RequestCompletion = {
      requestId,
      method: request.method ?? "GET",
      path: safePath(request.url),
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      aborted: !response.writableFinished,
    };
    try {
      options.onRequestComplete?.(event);
    } catch {
      /* A diagnostics sink must not affect the response. */
    }
    if (options.logger) {
      const level =
        event.aborted || event.statusCode >= 500
          ? "error"
          : event.statusCode >= 400
            ? "warn"
            : "info";
      options.logger[level]("HTTP request completed", { ...event });
    }
  };
  response.once("finish", report);
  response.once("close", report);
}

function safePath(url: string | undefined) {
  try {
    return new URL(url ?? "/", "http://localhost").pathname;
  } catch {
    return "/";
  }
}

function positiveTimeout(value: number) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error("Invalid HTTP timeout.");
  return value;
}

async function serveFrontend(
  root: string,
  requestUrl: string,
  method: string,
  response: import("node:http").ServerResponse,
) {
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(
      new URL(requestUrl, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400);
    response.end("Invalid URL");
    return;
  }
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    response.writeHead(404);
    response.end("No backend APIs are configured.");
    return;
  }
  const resolvedRoot = resolve(root);
  const file = resolve(root, `.${pathname}`);
  if (
    (file !== resolvedRoot && !file.startsWith(`${resolvedRoot}${sep}`)) ||
    pathname.includes("\\")
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const target = extname(pathname) ? file : resolve(root, "index.html");
  try {
    const [actualRoot, actualTarget] = await Promise.all([
      realpath(root),
      realpath(target),
    ]);
    if (
      actualTarget !== actualRoot &&
      !actualTarget.startsWith(`${actualRoot}${sep}`)
    ) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const content = await readFile(target);
    response.writeHead(200, {
      "Content-Type":
        contentTypes[extname(target)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(method === "HEAD" ? undefined : content);
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    response.writeHead(missing ? 404 : 500);
    response.end(missing ? "Not found" : "Unable to load frontend");
  }
}
