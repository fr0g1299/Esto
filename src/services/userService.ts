import { collection, query, where, getDocs } from "firebase/firestore";
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
