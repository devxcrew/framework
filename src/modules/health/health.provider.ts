export type HealthCheck = () => boolean;
export type HealthSnapshot = Readonly<Record<string, boolean>>;

export interface HealthProvider {
  isReady(): boolean;
  snapshot(): HealthSnapshot;
}

export function createHealthProvider(
  checks: Readonly<Record<string, HealthCheck>>,
): HealthProvider {
  const entries = Object.entries(checks);
  if (
    entries.some(([name, check]) => !name.trim() || typeof check !== "function")
  ) {
    throw new Error("Health checks require a name and function.");
  }
  return {
    isReady() {
      return entries.every(([, check]) => runCheck(check));
    },
    snapshot() {
      return Object.fromEntries(
        entries.map(([name, check]) => [name, runCheck(check)]),
      );
    },
  };
}

function runCheck(check: HealthCheck) {
  try {
    return check();
  } catch {
    return false;
  }
}
