import { SettingsService } from "./settings.service.js";
import type { SettingsOptions, SettingsProvider } from "./settings.types.js";
export function createSettingsProvider(
  options: SettingsOptions = {},
): SettingsProvider {
  const service = new SettingsService(options);
  return {
    current: () => service.current(),
    load: (root, overrides) => service.load(root, overrides),
    write: (root, patch) => service.write(root, patch),
  };
}
