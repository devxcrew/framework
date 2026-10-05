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

export interface ApplicationServerOptions {
  config: ApplicationConfig;
  frontendDirectory: string;
  developmentHandler?: RequestListener;
  apiHandler?: (
    request: import("node:http").IncomingMessage,
    response: import("node:http").ServerResponse,
    context: ReturnType<typeof createRequestContext>,
  ) => void | Promise<void>;
  readiness?: () => boolean;
  security?: HttpSecurityOptions;
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
  const security = createHttpSecurityProvider(options.security);
  const server = createServer((request, response) => {
    if (security.handle(request, response)) return;
    if (options.readiness && request.url === "/health/ready") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
      }
      let ready = false;
      try {
        ready = options.readiness();
      } catch {
        ready = false;
      }
      response.writeHead(ready ? 200 : 503, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(
        request.method === "HEAD" ? undefined : JSON.stringify({ ready }),
      );
      return;
    }
    if (options.apiHandler && /^\/api(?:\/|\?|$)/.test(request.url ?? "")) {
      const context = createRequestContext(
        request,
        Date.now() + handlerTimeoutMs,
      );
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
      response.setHeader("X-Request-ID", context.requestId);
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
    if (options.developmentHandler)
      return options.developmentHandler(request, response);
    void serveFrontend(
      options.frontendDirectory,
      request.url || "/",
      request.method || "GET",
      response,
    );
  });
  server.requestTimeout = positiveTimeout(options.requestTimeoutMs ?? 30_000);
  server.headersTimeout = positiveTimeout(options.headersTimeoutMs ?? 10_000);
  return server;
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
