export interface ApplicationConfig {
  name: string;
  port: number;
  url: string;
  host: string;
  mode: "development" | "production";
}

export function readApplicationConfig(
  env: Record<string, string | undefined>,
): ApplicationConfig {
  const name = required(env, "APP_NAME");
  const portValue = required(env, "APP_PORT");
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || port < 1 || port > 65535)
    throw new Error("APP_PORT must be an integer between 1 and 65535.");
  const mode = required(env, "APP_MODE");
  if (mode !== "development" && mode !== "production")
    throw new Error("APP_MODE must be development or production.");
  const url = new URL(required(env, "APP_URL"));
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "APP_URL must be an HTTP origin without credentials or a path.",
    );
  if (Number(url.port || (url.protocol === "https:" ? 443 : 80)) !== port)
    throw new Error("APP_URL must use APP_PORT.");
  return {
    name,
    port,
    url: url.origin,
    host: env.APP_HOST?.trim() || url.hostname,
    mode,
  };
}

function required(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}
