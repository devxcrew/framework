import {
  createMariaDbBackup,
  verifyMariaDbBackup,
  rehearseMariaDbRestore,
} from "../drivers/mariadb/index.js";
import {
  createDatabaseBackup,
  verifyDatabaseBackup,
} from "../drivers/sqlite/index.js";
import {
  connectionTargetSchema,
  type ConnectionTarget,
} from "../common/index.js";
export async function backupConnection(
  environment: NodeJS.ProcessEnv,
  input: ConnectionTarget,
  path: string,
) {
  const target = connectionTargetSchema.parse(input);
  if (target.driver === "mariadb")
    await createMariaDbBackup(
      { ...environment, DB_MASTER_NAME: target.databaseName! },
      path,
    );
  else await createDatabaseBackup(target.sqlitePath!, path);
}
export async function checkConnectionBackup(
  environment: NodeJS.ProcessEnv,
  input: ConnectionTarget,
  path: string,
  restore = false,
) {
  const target = connectionTargetSchema.parse(input);
  if (target.driver === "mariadb") {
    if (restore)
      await rehearseMariaDbRestore(
        { ...environment, DB_MASTER_NAME: target.databaseName! },
        path,
      );
    else await verifyMariaDbBackup(path);
  } else {
    if (restore)
      throw new Error(
        "SQLite backups are verified directly as restored snapshots.",
      );
    verifyDatabaseBackup(path);
  }
}
