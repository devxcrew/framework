import { z } from "zod";
import { mariaDbConfig } from "../drivers/mariadb/index.js";
import { sqliteConfig } from "../drivers/sqlite/index.js";

export function readDatabaseConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const normalized = { ...environment };
  const driver = normalized.DB_DRIVER;
  if (driver === "mariadb")
    return { driver, options: mariaDbConfig(normalized) } as const;
  if (driver !== "sqlite")
    throw new Error("DB_DRIVER must be mariadb or sqlite.");
  return { driver, ...sqliteConfig(normalized) } as const;
}

export const databaseCommandSchema = z.enum([
  "connections",
  "migrate",
  "seed",
  "seed:tenancy",
  "check",
  "smoke",
  "backup",
  "verify-backup",
  "verify-restore",
  "import-sqlite",
]);

export const connectionTargetSchema = z
  .strictObject({
    key: z.string().min(1).max(255),
    driver: z.enum(["sqlite", "mariadb"]),
    databaseName: z
      .string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/)
      .nullable(),
    sqlitePath: z.string().trim().min(1).nullable(),
    version: z.number().int().min(1),
  })
  .superRefine((target, context) => {
    if (target.driver === "mariadb" && !target.databaseName)
      context.addIssue({
        code: "custom",
        path: ["databaseName"],
        message: "Database name is required.",
      });
    if (target.driver === "sqlite" && !target.sqlitePath)
      context.addIssue({
        code: "custom",
        path: ["sqlitePath"],
        message: "Database path is required.",
      });
  });
