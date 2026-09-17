import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../app/lib/firebase";
import {
  HOPEBRIDGE_ORGANIZATION_ID,
  isOrganizationScopedCollection,
} from "@/lib/organization";

type FirestoreRecord = Record<string, unknown> & { id: string };

/**
 * Active organization context for scoped reads/writes.
 * Set by Auth/Org providers from the signed-in user's authorized membership.
 * Never accept a client-supplied org switcher without matching userProfiles.
 */
let activeOrganizationId: string | null = null;

export function setFirestoreOrganizationContext(
  organizationId: string | null | undefined,
): void {
  const next = typeof organizationId === "string" ? organizationId.trim() : "";
  activeOrganizationId = next || null;
}

export function getFirestoreOrganizationContext(): string | null {
  return activeOrganizationId;
}

function requireOrganizationContext(collectionName: string): string {
  if (!isOrganizationScopedCollection(collectionName)) {
    return "";
  }
  if (!activeOrganizationId) {
    throw new Error(
      `Organization context is required to access "${collectionName}".`,
    );
  }
  return activeOrganizationId;
}

function withOrganizationId(
  collectionName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (!isOrganizationScopedCollection(collectionName)) {
    return data;
  }
  const organizationId = requireOrganizationContext(collectionName);
  return {
    ...data,
    organizationId,
  };
}

/**
 * Soft-tag legacy HopeBridge docs that predate organizationId.
 * Additive only — never overwrites an existing organizationId.
 */
async function softTagLegacyOrganizationId(
  collectionName: string,
  record: FirestoreRecord,
): Promise<void> {
  if (!isOrganizationScopedCollection(collectionName)) return;
  if (activeOrganizationId !== HOPEBRIDGE_ORGANIZATION_ID) return;
  if (
    typeof record.organizationId === "string" &&
    record.organizationId.trim()
  ) {
    return;
  }

  try {
    await updateDoc(doc(db, collectionName, record.id), {
      organizationId: HOPEBRIDGE_ORGANIZATION_ID,
      updatedAt: serverTimestamp(),
    });
    record.organizationId = HOPEBRIDGE_ORGANIZATION_ID;
  } catch {
    // Best-effort; rules or offline may block. Reads still allow soft match.
  }
}

function belongsToActiveOrganization(
  collectionName: string,
  record: FirestoreRecord,
): boolean {
  if (!isOrganizationScopedCollection(collectionName)) return true;
  const orgId = activeOrganizationId;
  if (!orgId) return false;

  const recordOrg =
    typeof record.organizationId === "string"
      ? record.organizationId.trim()
      : "";

  if (recordOrg === orgId) return true;

  // Transition: untagged legacy docs belong to HopeBridge Foundation only.
  if (!recordOrg && orgId === HOPEBRIDGE_ORGANIZATION_ID) {
    return true;
  }

  return false;
}

function sanitizeWriteData(data: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

function mapSnapshotDocs(
  snapshot: QuerySnapshot<DocumentData>,
): FirestoreRecord[] {
  return snapshot.docs.map((snapshotDoc) => ({
    ...(snapshotDoc.data() as Record<string, unknown>),
    id: snapshotDoc.id,
  }));
}

async function filterAndSoftTag(
  collectionName: string,
  docs: FirestoreRecord[],
): Promise<FirestoreRecord[]> {
  if (!isOrganizationScopedCollection(collectionName)) {
    return docs;
  }

  const scoped = docs.filter((record) =>
    belongsToActiveOrganization(collectionName, record),
  );

  await Promise.all(
    scoped.map((record) => softTagLegacyOrganizationId(collectionName, record)),
  );

  return scoped;
}

/**
 * For HopeBridge only: merge query results with untagged legacy docs.
 * Never runs a full-collection scan for non-hopebridge tenants.
 */
async function mergeHopeBridgeLegacyDocs(
  collectionName: string,
  scopedDocs: FirestoreRecord[],
): Promise<FirestoreRecord[]> {
  const allSnapshot = await getDocs(collection(db, collectionName));
  const legacy = mapSnapshotDocs(allSnapshot).filter((record) => {
    const recordOrg =
      typeof record.organizationId === "string"
        ? record.organizationId.trim()
        : "";
    return !recordOrg;
  });
  const byId = new Map<string, FirestoreRecord>();
  for (const record of [...scopedDocs, ...legacy]) {
    byId.set(record.id, record);
  }
  return filterAndSoftTag(collectionName, [...byId.values()]);
}

// Create
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>,
) {
  const payload = withOrganizationId(collectionName, sanitizeWriteData(data));
  delete payload.createdAt;
  delete payload.updatedAt;

  const docRef = await addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Read
export async function getDocuments(collectionName: string) {
  if (isOrganizationScopedCollection(collectionName)) {
    const organizationId = requireOrganizationContext(collectionName);
    const scopedQuery = query(
      collection(db, collectionName),
      where("organizationId", "==", organizationId),
    );

    const snapshot = await getDocs(scopedQuery);
    const docs = mapSnapshotDocs(snapshot);

    if (organizationId === HOPEBRIDGE_ORGANIZATION_ID) {
      try {
        return await mergeHopeBridgeLegacyDocs(collectionName, docs);
      } catch {
        return filterAndSoftTag(collectionName, docs);
      }
    }

    return filterAndSoftTag(collectionName, docs);
  }

  const snapshot = await getDocs(collection(db, collectionName));
  return mapSnapshotDocs(snapshot);
}

/** Read a single document by id — preferred when rules allow get but not list. */
export async function getDocument(
  collectionName: string,
  id: string,
): Promise<FirestoreRecord | null> {
  const snapshot = await getDoc(doc(db, collectionName, id));
  if (!snapshot.exists()) return null;
  const record: FirestoreRecord = {
    ...(snapshot.data() as Record<string, unknown>),
    id: snapshot.id,
  };

  if (
    isOrganizationScopedCollection(collectionName) &&
    !belongsToActiveOrganization(collectionName, record)
  ) {
    return null;
  }

  if (isOrganizationScopedCollection(collectionName)) {
    await softTagLegacyOrganizationId(collectionName, record);
  }

  return record;
}

export function subscribeDocuments(
  collectionName: string,
  onData: (docs: FirestoreRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (isOrganizationScopedCollection(collectionName)) {
    const organizationId = requireOrganizationContext(collectionName);
    const scopedQuery = query(
      collection(db, collectionName),
      where("organizationId", "==", organizationId),
    );

    return onSnapshot(
      scopedQuery,
      (snapshot) => {
        void filterAndSoftTag(collectionName, mapSnapshotDocs(snapshot)).then(
          onData,
          (error) =>
            onError?.(
              error instanceof Error ? error : new Error(String(error)),
            ),
        );
      },
      (error) => {
        onError?.(error);
      },
    );
  }

  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      onData(mapSnapshotDocs(snapshot));
    },
    (error) => {
      onError?.(error);
    },
  );
}

// Update
export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const payload = sanitizeWriteData(data);
  delete payload.createdAt;
  delete payload.updatedAt;

  // Never allow clients to reassign organization scope via generic updates.
  if (isOrganizationScopedCollection(collectionName)) {
    delete payload.organizationId;
    requireOrganizationContext(collectionName);
  }

  await updateDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// Delete
export async function deleteDocument(collectionName: string, id: string) {
  if (isOrganizationScopedCollection(collectionName)) {
    requireOrganizationContext(collectionName);
  }
  await deleteDoc(doc(db, collectionName, id));
}

// Upsert with fixed document id
export async function setDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const payload = withOrganizationId(collectionName, sanitizeWriteData(data));

  await setDoc(
    doc(db, collectionName, id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
