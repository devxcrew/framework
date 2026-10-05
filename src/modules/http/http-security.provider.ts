import { isIP } from "node:net";
import {
  validateHeaderName,
  validateHeaderValue,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  maxEntries?: number;
}

export interface HttpSecurityOptions {
  allowedOrigins?: readonly string[];
  allowedMethods?: readonly string[];
  allowedHeaders?: readonly string[];
  exposedHeaders?: readonly string[];
  allowCredentials?: boolean;
  preflightMaxAgeSeconds?: number;
  headers?: Readonly<Record<string, string>>;
  trustedProxyAddresses?: readonly string[];
  rateLimit?: RateLimitOptions;
}

export interface HttpSecurityProvider {
  handle(request: IncomingMessage, response: ServerResponse): boolean;
  clientAddress(request: IncomingMessage): string;
}

const defaultMethods = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];
const defaultHeaders = ["Content-Type", "Authorization", "X-Request-ID"];

export function createHttpSecurityProvider(
  options: HttpSecurityOptions = {},
): HttpSecurityProvider {
  const origins = new Set((options.allowedOrigins ?? []).map(validateOrigin));
  const methods = validateTokens(
    options.allowedMethods ?? defaultMethods,
    "method",
    true,
  );
  const headers = validateTokens(
    options.allowedHeaders ?? defaultHeaders,
    "header",
  );
  const exposedHeaders = validateTokens(options.exposedHeaders ?? [], "header");
  const trustedProxies = new Set(
    (options.trustedProxyAddresses ?? []).map(validateAddress),
  );
  const maxAge = options.preflightMaxAgeSeconds ?? 600;
  if (!Number.isSafeInteger(maxAge) || maxAge < 0 || maxAge > 86_400)
    throw new Error("Invalid CORS max age.");
  if (options.allowCredentials && origins.size === 0)
    throw new Error("Credentialed CORS requires allowed origins.");
  const customHeaders = Object.entries(options.headers ?? {});
  for (const [name, value] of customHeaders) {
    validateHeaderName(name);
    validateHeaderValue(name, value);
  }
  const limiter = options.rateLimit
    ? createLimiter(options.rateLimit)
    : undefined;
  const clientAddress = (request: IncomingMessage) =>
    resolveClientAddress(request, trustedProxies);

  return {
    handle(request, response) {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("X-Frame-Options", "DENY");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      for (const [name, value] of customHeaders)
        response.setHeader(name, value);

      if (limiter) {
        const retryAfter = limiter(clientAddress(request));
        if (retryAfter > 0) {
          response.writeHead(429, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfter),
          });
          response.end(
            JSON.stringify({
              error: {
                code: "rate_limit_exceeded",
                message: "Too many requests.",
              },
            }),
          );
          return true;
        }
      }

      const origin = request.headers.origin;
      if (!origins.size || !origin) return false;
      response.setHeader(
        "Vary",
        appendVary(response.getHeader("Vary"), "Origin"),
      );
      if (!origins.has(origin)) {
        response.writeHead(403, { "Cache-Control": "no-store" });
        response.end();
        return true;
      }
      response.setHeader("Access-Control-Allow-Origin", origin);
      if (options.allowCredentials)
        response.setHeader("Access-Control-Allow-Credentials", "true");
      if (exposedHeaders.length)
        response.setHeader(
          "Access-Control-Expose-Headers",
          exposedHeaders.join(", "),
        );

      const requestedMethod = request.headers["access-control-request-method"];
      if (request.method === "OPTIONS" && requestedMethod) {
        response.setHeader(
          "Vary",
          appendVary(
            appendVary(
              response.getHeader("Vary"),
              "Access-Control-Request-Method",
            ),
            "Access-Control-Request-Headers",
          ),
        );
        const requestedHeaders = (
          request.headers["access-control-request-headers"] ?? ""
        )
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        if (
          !methods.includes(requestedMethod) ||
          requestedHeaders.some(
            (name) =>
              !headers.some(
                (allowed) => allowed.toLowerCase() === name.toLowerCase(),
              ),
          )
        ) {
          response.writeHead(403, { "Cache-Control": "no-store" });
          response.end();
          return true;
        }
        response.setHeader("Access-Control-Allow-Methods", methods.join(", "));
        if (requestedHeaders.length)
          response.setHeader(
            "Access-Control-Allow-Headers",
            requestedHeaders.join(", "),
          );
        response.setHeader("Access-Control-Max-Age", String(maxAge));
        response.writeHead(204);
        response.end();
        return true;
      }
      if (!methods.includes(request.method ?? "GET")) {
        response.writeHead(405, { Allow: methods.join(", ") });
        response.end();
        return true;
      }
      return false;
    },
    clientAddress,
  };
}

function resolveClientAddress(
  request: IncomingMessage,
  trustedProxies: ReadonlySet<string>,
) {
  const peer = normalizeAddress(request.socket.remoteAddress ?? "");
  if (!peer || !trustedProxies.has(peer)) return peer || "unknown";
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded !== "string") return peer;
  const chain = forwarded
    .split(",")
    .map((value) => normalizeAddress(value.trim()));
  if (!chain.length || chain.some((value) => !value)) return peer;
  for (const candidate of chain.reverse()) {
    if (!trustedProxies.has(candidate)) return candidate;
  }
  return peer;
}

function createLimiter(options: RateLimitOptions) {
  const maxEntries = options.maxEntries ?? 10_000;
  if (
    !Number.isSafeInteger(options.limit) ||
    options.limit < 1 ||
    !Number.isSafeInteger(options.windowMs) ||
    options.windowMs < 1 ||
    !Number.isSafeInteger(maxEntries) ||
    maxEntries < 1 ||
    maxEntries > 100_000
  ) {
    throw new Error("Invalid rate limit.");
  }
  const clients = new Map<string, { count: number; resetAt: number }>();
  return (address: string) => {
    const now = Date.now();
    for (const [key, record] of clients)
      if (record.resetAt <= now) clients.delete(key);
    let record = clients.get(address);
    if (!record) {
      if (clients.size >= maxEntries) return Math.ceil(options.windowMs / 1000);
      record = { count: 0, resetAt: now + options.windowMs };
      clients.set(address, record);
    }
    if (record.count >= options.limit)
      return Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    record.count++;
    return 0;
  };
}

function validateOrigin(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid allowed origin.");
  }
  if (!(
    ["http:", "https:"].includes(parsed.protocol) && parsed.origin === value
  ))
    throw new Error("Allowed origins must be exact HTTP origins.");
  return value;
}

function validateTokens(
  values: readonly string[],
  kind: "method" | "header",
  uppercase = false,
) {
  for (const value of values) {
    if (
      !value ||
      (uppercase
        ? !/^[A-Z]+$/.test(value)
        : !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(value))
    )
      throw new Error(`Invalid CORS ${kind}.`);
  }
  return [...new Set(values)];
}

function validateAddress(value: string) {
  const address = normalizeAddress(value);
  if (!address) throw new Error("Trusted proxies must use IP addresses.");
  return address;
}

function normalizeAddress(value: string) {
  const address = value.toLowerCase().replace(/^::ffff:/, "");
  return isIP(address) ? address : "";
}

function appendVary(
  existing: string | number | readonly string[] | undefined,
  value: string,
) {
  const values = (
    Array.isArray(existing) ? existing.join(",") : String(existing ?? "")
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase()))
    values.push(value);
  return values.join(", ");
}
