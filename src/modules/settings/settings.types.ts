import type { z } from "zod";
export interface SettingsOptions {
  defaults?: Readonly<NodeJS.ProcessEnv>;
  schema?: z.ZodType;
  writableKeys?: readonly string[];
}
export interface SettingsProvider {
  current(): Readonly<NodeJS.ProcessEnv>;
  load(
    root?: string,
    overrides?: NodeJS.ProcessEnv,
  ): Readonly<NodeJS.ProcessEnv>;
  write(root: string, patch: Readonly<NodeJS.ProcessEnv>): Promise<void>;
}
