import { createDocument } from "./firestore";
import { isDemoSeedEnabled, shouldRunInitialSeed } from "./seed";

/**
 * Runs one-time demo seed for a collection when NEXT_PUBLIC_ENABLE_DEMO_SEED=true.
 * Production installs never seed automatically.
 */
export async function seedCollectionIfDemo<T extends { id?: string }>(options: {
  seedKey: string;
  collection: string;
  existing: T[];
  demoRecords: T[];
  matchExisting: (existing: T[], demo: T) => boolean;
}): Promise<T[]> {
  const { seedKey, collection, existing, demoRecords, matchExisting } = options;

  if (!(await shouldRunInitialSeed(seedKey))) {
    return existing;
  }

  const missing = demoRecords.filter((demo) => !matchExisting(existing, demo));
  if (missing.length === 0) {
    await createDocument("appMetadata", { key: seedKey, completed: true });
    return existing;
  }

  const created = await Promise.all(
    missing.map(async (record) => {
      const { id: _id, ...data } = record as T & { id: string };
      const firestoreId = await createDocument(collection, data);
      return { ...record, id: firestoreId } as T;
    }),
  );

  await createDocument("appMetadata", { key: seedKey, completed: true });
  return [...existing, ...created];
}

export { isDemoSeedEnabled };
