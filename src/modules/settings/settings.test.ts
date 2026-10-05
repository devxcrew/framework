import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseEnv } from "node:util";
import { z } from "zod";
import { createSettingsProvider } from "./index.js";

test("settings providers isolate snapshots and never change process environment", async () => {
  const directory = await mkdtemp(join(tmpdir(), "settings-"));
  const before = process.env.APP_NAME;
  try {
    await writeFile(
      join(directory, ".env"),
      "APP_NAME=File name\nAPP_PORT=4100\n",
    );
    const first = createSettingsProvider({
      defaults: { APP_NAME: "First", APP_PORT: "3000" },
    });
    const second = createSettingsProvider({ defaults: { APP_NAME: "Second" } });
    const loaded = first.load(directory, { APP_PORT: "4200" });
    assert.equal(loaded.APP_NAME, "File name");
    assert.equal(loaded.APP_PORT, "4200");
    assert.equal(second.current().APP_NAME, "Second");
    assert.equal(process.env.APP_NAME, before);
    assert.ok(Object.isFrozen(loaded));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("settings writes validate allowlisted values and preserve comments and secrets", async () => {
  const directory = await mkdtemp(join(tmpdir(), "settings-write-"));
  const provider = createSettingsProvider({
    schema: z.object({
      APP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    }),
    writableKeys: ["APP_PORT", "APP_NAME", "STORAGE_ROOT"],
  });
  try {
    const path = join(directory, ".env");
    await writeFile(
      path,
      "# Keep this comment\nSECRET=private\nAPP_PORT=3000\nAPP_PORT=3001\n",
    );
    await assert.rejects(
      provider.write(directory, { SECRET: "changed" }),
      /unsupported/,
    );
    await assert.rejects(
      async () => provider.write(directory, { APP_PORT: "0" }),
      /Invalid/,
    );
    await assert.rejects(
      provider.write(directory, { APP_NAME: "name\nBAD=1" }),
      /unsupported/,
    );
    await Promise.all([
      provider.write(directory, {
        APP_PORT: "4200",
        STORAGE_ROOT: "D:\\Some Folder\\data",
      }),
      provider.write(directory, { APP_NAME: 'Quoted "name" # one' }),
    ]);
    const contents = await readFile(path, "utf8");
    const values = parseEnv(contents);
    assert.equal(values.APP_PORT, "4200");
    assert.equal(values.SECRET, "private");
    assert.equal(values.STORAGE_ROOT, "D:\\Some Folder\\data");
    assert.equal(values.APP_NAME, 'Quoted "name" # one');
    assert.ok(contents.startsWith("# Keep this comment\n"));
    assert.equal((contents.match(/^APP_PORT=/gm) ?? []).length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
