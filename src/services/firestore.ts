import {
  collection,
  addDoc,
  getDocs,
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
  isDefaultOrganization,
  isOrganizationScopedCollection,
} from "../lib/organization";

type FirestoreRecord = Record<string, unknown> & { id: string };

type OrganizationContext = {
  organizationId: string | null;
};

const organizationContext: OrganizationContext = {
  organizationId: null,
};

/**
 * Set by AuthProvider after the user profile (and organization) is resolved.
 * Scoped helpers refuse to read/write application data without this context.
 */
export function setFirestoreOrganizationContext(
  organizationId: string | null,
): void {
  organizationContext.organizationId = organizationId;
}

export function getActiveOrganizationId(): string | null {
  return organizationContext.organizationId;
}

function requireOrganizationId(collectionName: string): string {
  const organizationId = organizationContext.organizationId;
  if (!organizationId) {
    throw new Error(
      `Organization context is required before accessing "${collectionName}".`,
    );
  }
  return organizationId;
}

function shouldScopeCollection(collectionName: string) {
  return isOrganizationScopedCollection(collectionName);
}

function sanitizeWriteData(data: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

function withOrganizationId(
  collectionName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (!shouldScopeCollection(collectionName)) {
    return data;
  }

  const organizationId = requireOrganizationId(collectionName);
  return {
    ...data,
    organizationId,
  };
}

function mapSnapshotDocs(snapshot: QuerySnapshot<DocumentData>): FirestoreRecord[] {
  return snapshot.docs.map((snapshotDoc) => ({
    ...(snapshotDoc.data() as Record<string, unknown>),
    id: snapshotDoc.id,
  }));
}

function scopedCollectionQuery(collectionName: string, organizationId: string) {
  return query(
    collection(db, collectionName),
    where("organizationId", "==", organizationId),
  );
}

/**
 * Soft-tag legacy documents missing organizationId (default org only).
 * Additive only — never deletes or rewrites unrelated fields.
 * Must run (and complete) for the default org before scoped queries are used,
 * so existing Campaign/Donor/etc. rows remain visible.
 */
export async function tagLegacyOrganizationIds(
  collectionName: string,
): Promise<number> {
  if (!shouldScopeCollection(collectionName)) return 0;

  const organizationId = requireOrganizationId(collectionName);
  if (!isDefaultOrganization(organizationId)) return 0;

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    let tagged = 0;

    await Promise.all(
      snapshot.docs.map(async (snapshotDoc) => {
        const data = snapshotDoc.data() as Record<string, unknown>;
        if (
          typeof data.organizationId === "string" &&
          data.organizationId.trim()
        ) {
          return;
        }

        await updateDoc(snapshotDoc.ref, {
          organizationId,
          updatedAt: serverTimestamp(),
        });
        tagged += 1;
      }),
    );

    return tagged;
  } catch (error) {
    // After org-scoped rules are deployed, unconstrained collection scans may
    // be denied — treat as "already migrated / not taggable from client".
    console.warn(
      `Skipping legacy organization soft-tag for ${collectionName}.`,
      error,
    );
    return 0;
  }
}

// Create
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>,
) {
  const payload = withOrganizationId(
    collectionName,
    sanitizeWriteData(data),
  );
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
  if (!shouldScopeCollection(collectionName)) {
    const snapshot = await getDocs(collection(db, collectionName));
    return mapSnapshotDocs(snapshot);
  }

  const organizationId = requireOrganizationId(collectionName);
  const snapshot = await getDocs(
    scopedCollectionQuery(collectionName, organizationId),
  );
  return mapSnapshotDocs(snapshot);
}

export function subscribeDocuments(
  collectionName: string,
  onData: (docs: FirestoreRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!shouldScopeCollection(collectionName)) {
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

  let organizationId: string;
  try {
    organizationId = requireOrganizationId(collectionName);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return () => {};
  }

  return onSnapshot(
    scopedCollectionQuery(collectionName, organizationId),
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
  // Never allow clients to move a record across organizations via update.
  delete payload.organizationId;

  const writePayload = shouldScopeCollection(collectionName)
    ? {
        ...payload,
        organizationId: requireOrganizationId(collectionName),
      }
    : payload;

  await updateDoc(doc(db, collectionName, id), {
    ...writePayload,
    updatedAt: serverTimestamp(),
  });
}

// Delete
export async function deleteDocument(collectionName: string, id: string) {
  if (shouldScopeCollection(collectionName)) {
    requireOrganizationId(collectionName);
  }
  await deleteDoc(doc(db, collectionName, id));
}

// Upsert with fixed document id
export async function setDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const payload = withOrganizationId(
    collectionName,
    sanitizeWriteData(data),
  );

  await setDoc(
    doc(db, collectionName, id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
