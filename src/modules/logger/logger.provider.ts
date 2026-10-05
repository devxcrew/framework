export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Readonly<Record<string, unknown>>;

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface Logger {
  child(fields: LogFields): Logger;
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  sink?: (record: LogRecord) => void;
  context?: LogFields;
}

const priorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const secretField =
  /(?:secret|password|passwd|token|authorization|cookie|credential|api[-_]?key|private[-_]?key)/i;
const secretQuery =
  /([?&](?:access[-_]?token|refresh[-_]?token|client[-_]?secret|token|secret|password|api[-_]?key)=)[^&#\s]*/gi;
const bearer = /\bBearer\s+[^\s,;]+/gi;
const urlCredentials = /(\b[a-z][a-z\d+.-]*:\/\/)[^/@\s]+@/gi;

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? "info";
  if (!(level in priorities)) throw new Error("Invalid log level.");
  const sink = options.sink ?? writeConsoleRecord;
  return makeLogger(level, sink, options.context ?? {});
}

function makeLogger(
  level: LogLevel,
  sink: (record: LogRecord) => void,
  context: LogFields,
): Logger {
  const write = (
    entryLevel: LogLevel,
    message: string,
    fields: LogFields = {},
  ) => {
    if (priorities[entryLevel] < priorities[level]) return;
    const record = redact({
      ...context,
      ...fields,
      timestamp: new Date().toISOString(),
      level: entryLevel,
      message,
    }) as LogRecord;
    try {
      sink(record);
    } catch {
      /* Logging failures must not break application work. */
    }
  };
  return {
    child(fields) {
      return makeLogger(level, sink, { ...context, ...fields });
    },
    debug(message, fields) {
      write("debug", message, fields);
    },
    info(message, fields) {
      write("info", message, fields);
    },
    warn(message, fields) {
      write("warn", message, fields);
    },
    error(message, fields) {
      write("error", message, fields);
    },
  };
}

function writeConsoleRecord(record: LogRecord) {
  const output = JSON.stringify(record);
  if (record.level === "error") console.error(output);
  else if (record.level === "warn") console.warn(output);
  else if (record.level === "debug") console.debug(output);
  else console.info(output);
}

function redact(
  value: unknown,
  parentKey = "",
  seen = new WeakSet<object>(),
): unknown {
  if (secretField.test(parentKey)) return "[REDACTED]";
  if (typeof value === "string") {
    return value
      .replace(bearer, "Bearer [REDACTED]")
      .replace(urlCredentials, "$1[REDACTED]@")
      .replace(secretQuery, "$1[REDACTED]");
  }
  if (value instanceof Error)
    return { name: value.name, message: redact(value.message) };
  if (value instanceof URL) return redact(value.toString());
  if (typeof value === "bigint") return value.toString();
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, "", seen));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, redact(item, key, seen)]),
  );
}
