export interface ApiClientOptions {
  baseUrl: string | URL;
  headers?: HeadersInit;
  fetch?: typeof fetch;
}

export interface ApiClient {
  request<T>(path: string | URL, init?: RequestInit): Promise<T>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl =
    options.baseUrl instanceof URL ? options.baseUrl : new URL(options.baseUrl);
  const fetcher = options.fetch ?? globalThis.fetch;
  if (typeof fetcher !== "function")
    throw new Error("A Fetch implementation is required.");
  return {
    async request<T>(path: string | URL, init: RequestInit = {}): Promise<T> {
      const url = path instanceof URL ? path : new URL(path, baseUrl);
      const headers = new Headers(options.headers);
      new Headers(init.headers).forEach((value, key) =>
        headers.set(key, value),
      );
      const response = await fetcher(url, { ...init, headers });
      if (response.status === 204 || init.method?.toUpperCase() === "HEAD")
        return undefined as T;
      const payload = await readPayload(response);
      if (!response.ok) throw toApiError(response, payload);
      return payload as T;
    },
  };
}

async function readPayload(response: Response): Promise<unknown> {
  if (
    !/application\/(?:[a-z0-9.+-]+\+)?json/i.test(
      response.headers.get("content-type") ?? "",
    )
  )
    return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function toApiError(response: Response, payload: unknown) {
  const envelope = asRecord(payload);
  const error = asRecord(envelope?.error);
  const code =
    stringValue(error?.code) ??
    (response.status === 422 ? "validation_failed" : "request_failed");
  const message =
    stringValue(error?.message) ??
    stringValue(envelope?.message) ??
    "The request could not be completed.";
  return new ApiClientError(
    message,
    response.status,
    code,
    stringValue(error?.requestId) ??
      stringValue(envelope?.requestId) ??
      response.headers.get("x-request-id") ??
      undefined,
    readFields(error?.fields) ?? readFields(envelope?.errors),
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readFields(value: unknown): Record<string, string[]> | undefined {
  const source = asRecord(value);
  if (!source) return undefined;
  const fields: Record<string, string[]> = Object.create(null);
  for (const [name, messages] of Object.entries(source)) {
    if (
      Array.isArray(messages) &&
      messages.every((message) => typeof message === "string")
    )
      fields[name] = messages;
  }
  return Object.keys(fields).length
    ? Object.fromEntries(Object.entries(fields))
    : undefined;
}
