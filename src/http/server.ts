import { createServer, type RequestListener } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { ApplicationConfig } from "../runtime/config.js";

export interface ApplicationServerOptions {
  config: ApplicationConfig;
  frontendDirectory: string;
  developmentHandler?: RequestListener;
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
  return createServer((request, response) => {
    if (options.developmentHandler)
      return options.developmentHandler(request, response);
    void serveFrontend(
      options.frontendDirectory,
      request.url || "/",
      request.method || "GET",
      response,
    );
  });
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
