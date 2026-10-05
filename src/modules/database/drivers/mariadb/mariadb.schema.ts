import { z } from "zod";

const connectionSchema = z.object({
  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_MASTER_NAME: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/),
});

export function mariaDbConfig(environment: NodeJS.ProcessEnv) {
  const result = connectionSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      `Invalid MariaDB configuration: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }
  const value = result.data;
  return {
    host: value.DB_HOST,
    port: value.DB_PORT,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    database: value.DB_MASTER_NAME,
    connectionLimit: 10,
    connectTimeout: 10000,
    charset: "utf8mb4_bin",
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: false,
    timezone: "Z",
  };
}
