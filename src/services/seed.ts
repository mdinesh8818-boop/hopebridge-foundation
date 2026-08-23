import { getDocuments } from "./firestore";

/**
 * Demo seed data is OFF by default.
 * Set NEXT_PUBLIC_ENABLE_DEMO_SEED=true only for local/demo environments.
 */
export function isDemoSeedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "true";
}

export async function isSeedComplete(seedKey: string): Promise<boolean> {
  try {
    const metadata = await getDocuments("appMetadata");
    return metadata.some(
      (record: { key?: string; id: string }) =>
        "key" in record && record.key === seedKey,
    );
  } catch {
    return false;
  }
}

/** Returns true only when demo seeding is explicitly enabled and not yet done. */
export async function shouldRunInitialSeed(seedKey: string): Promise<boolean> {
  if (!isDemoSeedEnabled()) return false;
  return !(await isSeedComplete(seedKey));
}
