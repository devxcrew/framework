import mysql from "mysql2/promise";
import { createConnection, createPool } from "mysql2";
import { MysqlDialect } from "kysely";
import { mariaDbConfig } from "./mariadb.schema.js";

export function createMariaDbDialect(environment: NodeJS.ProcessEnv) {
  const config = mariaDbConfig(environment);
  return new MysqlDialect({
    pool: async () => createPool(config),
    controlConnection: createConnection,
  });
}

export async function ensureMariaDbDatabase(
  environment: NodeJS.ProcessEnv,
  name: string,
) {
  const config = mariaDbConfig({ ...environment, DB_MASTER_NAME: name });
  const { database, ...options } = config;
  const connection = await mysql.createConnection(options);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
    );
  } finally {
    await connection.end();
  }
}
