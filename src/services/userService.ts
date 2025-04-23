import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export const getUserListings = async (userId: string) => {
  const listingsQuery = query(
    collection(db, "properties"),
    where("ownerId", "==", userId)
  );

  const snapshot = await getDocs(listingsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    price: doc.data().price,
    imageUrl: doc.data().imageUrl,
  }));
};

export const getUserNotificationBoolean = async (userId: string) => {
  const userDoc = await getDoc(doc(db, "users", userId));

  return userDoc.exists()
    ? userDoc.data().pushNotificationsEnabled || false
    : false;
};

export const updateUserNotificationBoolean = async (
  userId: string,
  check: boolean
) => {
  await updateDoc(doc(db, "users", userId), {
    pushNotificationsEnabled: check,
  });
};
