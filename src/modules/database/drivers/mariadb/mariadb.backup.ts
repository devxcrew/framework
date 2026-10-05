import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  access,
  mkdir,
  mkdtemp,
  writeFile,
  readFile,
  link,
  rm,
  stat,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { mariaDbConfig } from "./mariadb.schema.js";

function option(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n").replaceAll("\r", "\\r")}"`;
}

async function withCredentials<T>(
  environment: NodeJS.ProcessEnv,
  action: (path: string) => Promise<T>,
) {
  const config = mariaDbConfig(environment);
  const base = resolve(
    environment.DB_BACKUP_DIR ?? "storage/private/data/backup",
  );
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(join(base, ".mariadb-"));
  const path = join(directory, "client.cnf");
  try {
    await writeFile(
      path,
      `[client]\nhost=${option(config.host)}\nport=${config.port}\nuser=${option(config.user)}\npassword=${option(config.password)}\n`,
      { mode: 0o600, flag: "wx" },
    );
    return await action(path);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function run(command: string, args: string[], input?: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: [input ? "pipe" : "ignore", "ignore", "ignore"],
      windowsHide: true,
    });
    child.once("error", () =>
      reject(
        new Error(
          "MariaDB client executable unavailable; configure DB_DUMP_BIN and DB_CLIENT_BIN.",
        ),
      ),
    );
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`MariaDB client command failed (${code}).`)),
    );
    if (input) {
      const stream = createReadStream(input);
      stream.once("error", reject);
      child.stdin!.once("error", reject);
      stream.pipe(child.stdin!);
    }
  });
}

export async function createMariaDbBackup(
  environment: NodeJS.ProcessEnv,
  destination: string,
) {
  const config = mariaDbConfig(environment);
  const target = resolve(destination);
  await mkdir(dirname(target), { recursive: true });
  try {
    await access(target);
    throw new Error("Backup destination already exists.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const directory = await mkdtemp(join(dirname(target), ".mariadb-snapshot-"));
  const snapshot = join(directory, "snapshot.sql");
  try {
    await withCredentials(environment, (path) =>
      run(environment.DB_DUMP_BIN || "mariadb-dump", [
        `--defaults-extra-file=${path}`,
        "--single-transaction",
        "--quick",
        "--hex-blob",
        "--routines",
        "--triggers",
        `--result-file=${snapshot}`,
        config.database,
      ]),
    );
    if (!(await stat(snapshot)).size)
      throw new Error("MariaDB dump was empty.");
    const metadata = {
      database: config.database,
      createdAt: new Date().toISOString(),
      sha256: await checksum(snapshot),
    };
    await link(snapshot, target);
    await writeFile(
      `${target}.json`,
      JSON.stringify(metadata, null, 2) + "\n",
      {
        flag: "wx",
        mode: 0o600,
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function verifyMariaDbBackup(path: string) {
  const metadata = JSON.parse(await readFile(`${path}.json`, "utf8")) as {
    sha256: string;
  };
  if (!(await stat(path)).size || (await checksum(path)) !== metadata.sha256)
    throw new Error("MariaDB backup checksum failed.");
}

export async function rehearseMariaDbRestore(
  environment: NodeJS.ProcessEnv,
  path: string,
) {
  await verifyMariaDbBackup(path);
  const config = mariaDbConfig(environment);
  const { database: master, ...connection } = config;
  const target = `${master.slice(0, 32)}_restore_${randomBytes(6).toString("hex")}`;
  if (target.length > 64)
    throw new Error("Master name too long for an isolated restore database.");
  const db = await mysql.createConnection(connection);
  let created = false;
  let userCreated = false;
  const user = `restore_${randomBytes(8).toString("hex")}`;
  const password = randomBytes(32).toString("base64url");
  try {
    await db.query(
      `CREATE DATABASE ${mysql.escapeId(target)} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
    );
    created = true;
    await db.query("CREATE USER ?@'%' IDENTIFIED BY ?", [user, password]);
    userCreated = true;
    await db.query(
      `GRANT ALL PRIVILEGES ON ${mysql.escapeId(target)}.* TO ?@'%'`,
      [user],
    );
    await withCredentials(
      { ...environment, DB_USER: user, DB_PASSWORD: password },
      (credential) =>
        run(
          environment.DB_CLIENT_BIN || "mariadb",
          [`--defaults-extra-file=${credential}`, "--batch", target],
          path,
        ),
    );
    const [tables] = await db.query<mysql.RowDataPacket[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",
      [target],
    );
    if (!tables.length) throw new Error("Restored database has no tables.");
    for (const row of tables) {
      const table = String(row.TABLE_NAME);
      const [checks] = await db.query<mysql.RowDataPacket[]>(
        `CHECK TABLE ${mysql.escapeId(target)}.${mysql.escapeId(table)}`,
      );
      if (
        !checks.some(
          (check) => check.Msg_type === "status" && check.Msg_text === "OK",
        )
      )
        throw new Error(`Restore table check failed: ${table}`);
    }
    console.info(`Isolated restore passed: ${tables.length} tables checked.`);
  } finally {
    try {
      if (created) await db.query(`DROP DATABASE ${mysql.escapeId(target)}`);
    } finally {
      try {
        if (userCreated) await db.query("DROP USER ?@'%'", [user]);
      } finally {
        await db.end();
      }
    }
  }
}

async function checksum(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
