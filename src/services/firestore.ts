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
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "../app/lib/firebase";

type FirestoreRecord = Record<string, unknown> & { id: string };

function sanitizeWriteData(data: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "id" || value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

function mapSnapshotDocs(snapshot: QuerySnapshot<DocumentData>): FirestoreRecord[] {
  return snapshot.docs.map((snapshotDoc) => ({
    ...(snapshotDoc.data() as Record<string, unknown>),
    id: snapshotDoc.id,
  }));
}

// Create
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>,
) {
  const payload = sanitizeWriteData(data);
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
  return {
    ...(snapshot.data() as Record<string, unknown>),
    id: snapshot.id,
  };
}

export function subscribeDocuments(
  collectionName: string,
  onData: (docs: FirestoreRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
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

  await updateDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

// Delete
export async function deleteDocument(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

// Upsert with fixed document id
export async function setDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
) {
  const payload = sanitizeWriteData(data);

  await setDoc(
    doc(db, collectionName, id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
