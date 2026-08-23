import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp,
  } from "firebase/firestore";
  
  import { db } from "../app/lib/firebase";
  
  // Create
  export async function createDocument(
    collectionName: string,
    data: Record<string, any>
  ) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  
    return docRef.id;
  }
  
  // Read
  export async function getDocuments(collectionName: string) {
    const snapshot = await getDocs(collection(db, collectionName));
  
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }
  
  // Update
  export async function updateDocument(
    collectionName: string,
    id: string,
    data: Record<string, any>
  ) {
    await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
  
  // Delete
  export async function deleteDocument(
    collectionName: string,
    id: string
  ) {
    await deleteDoc(doc(db, collectionName, id));
  }

  // Upsert with fixed document id
  export async function setDocument(
    collectionName: string,
    id: string,
    data: Record<string, unknown>,
  ) {
    await setDoc(
      doc(db, collectionName, id),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }