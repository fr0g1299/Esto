import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";

export interface FavoriteFolder {
  id: string;
  title: string;
  propertyCount: number;
}

export interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  disposition: string;
  imageUrl: string;
  note?: string;
}

export interface SavedFilter {
  id: string;
  title: string;
  criteria: string;
}

// Get all favorite folders for a user
export const getFavoriteFolders = async (
  userId: string
): Promise<FavoriteFolder[]> => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "favoriteFolders")
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    propertyCount: doc.data().propertyCount,
  }));
};

export const removeFavoriteFolder = async (
  userId: string,
  folderId: string
) => {
  const folderRef = await doc(db, "users", userId, "favoriteFolders", folderId);

  const existing = await getDoc(folderRef);

  if (existing.exists()) {
    await deleteDoc(folderRef);
  }
};

//Get all properties in a specific folder
export const getPropertiesInFolder = async (
  userId: string,
  folderId: string
): Promise<FavoriteProperty[]> => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "favoriteFolders", folderId, "properties")
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    price: doc.data().price,
    disposition: doc.data().disposition,
    imageUrl: doc.data().imageUrl,
    note: doc.data().note,
  }));
};

// Create a new favorite folder and return its ID
export const createFavoriteFolder = async (
  userId: string,
  title: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  const foldersRef = collection(db, "users", userId, "favoriteFolders");
  const snapshot = await getDocs(foldersRef);

  // Check if a folder with the same title already exists
  const folderExists = snapshot.docs.some(
    (doc) => doc.data().title.toLowerCase() === title.toLowerCase()
  );

  if (folderExists) {
    return {
      success: false,
      error: "Složka s tímto názvem již existuje!",
    };
  }

  const docRef = await addDoc(foldersRef, {
    title,
    createdAt: serverTimestamp(),
    propertyCount: 0,
  });

  return {
    success: true,
    id: docRef.id,
  };
};

// Add or update a property inside a folder
export const addPropertyToFolder = async (
  userId: string,
  folderId: string,
  propertyId: string,
  property: FavoriteProperty
) => {
  const propertyRef = doc(
    db,
    "users",
    userId,
    "favoriteFolders",
    folderId,
    "properties",
    propertyId
  );

  const existing = await getDoc(propertyRef);

  if (!existing.exists()) {
    await setDoc(propertyRef, {
      ...property,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", userId, "favoriteFolders", folderId), {
      propertyCount: increment(1),
    });
  } else {
    // If it exists, just update the note or other data (no count change)
    await setDoc(propertyRef, {
      ...property,
      createdAt: existing.data().createdAt || serverTimestamp(),
    });
  }
};

// Remove a property from a folder
export const removePropertyFromFolder = async (
  userId: string,
  folderId: string,
  propertyId: string
) => {
  const propertyRef = doc(
    db,
    "users",
    userId,
    "favoriteFolders",
    folderId,
    "properties",
    propertyId
  );

  const existing = await getDoc(propertyRef);

  if (existing.exists()) {
    await deleteDoc(propertyRef);
    await updateDoc(doc(db, "users", userId, "favoriteFolders", folderId), {
      propertyCount: increment(-1),
    });
  }
};

// Check if a property is already favorited by the user
export const isPropertyFavorited = async (
  userId: string,
  propertyId: string
): Promise<boolean> => {
  const foldersRef = collection(db, "users", userId, "favoriteFolders");
  const foldersSnap = await getDocs(foldersRef);

  for (const folderDoc of foldersSnap.docs) {
    const propertyRef = doc(
      db,
      "users",
      userId,
      "favoriteFolders",
      folderDoc.id,
      "properties",
      propertyId
    );
    const propertySnap = await getDoc(propertyRef);
    if (propertySnap.exists()) {
      return true;
    }
  }

  return false;
};

// Get all favorite folders containing a specific property
export const getFoldersContainingProperty = async (
  userId: string,
  propertyId: string
): Promise<string[]> => {
  const snapshot = await getDocs(
    collection(db, `users/${userId}/favoriteFolders`)
  );

  const matchingFolderIds: string[] = [];

  for (const folderDoc of snapshot.docs) {
    const folderId = folderDoc.id;
    const propRef = doc(
      db,
      "users",
      userId,
      "favoriteFolders",
      folderId,
      "properties",
      propertyId
    );
    const propDoc = await getDoc(propRef);
    if (propDoc.exists()) {
      matchingFolderIds.push(folderId);
    }
  }

  return matchingFolderIds;
};

export const saveFavoriteFilter = async (
  userId: string,
  filterName: string,
  filterCriteria: string
) => {
  await addDoc(collection(db, "users", userId, "savedFilters"), {
    filterName,
    filterCriteria,
    createdAt: serverTimestamp(),
  });
};

export const getSavedFilters = async (
  userId: string
): Promise<SavedFilter[]> => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "savedFilters")
  );
  console.log("fetching filters");
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().filterName,
    criteria: doc.data().filterCriteria,
  }));
};

export const removeSavedFilter = async (userId: string, filterId: string) => {
  const filterRef = doc(db, "users", userId, "savedFilters", filterId);

  const existing = await getDoc(filterRef);

  if (existing.exists()) {
    await deleteDoc(filterRef);
  }
};
