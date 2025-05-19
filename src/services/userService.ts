import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  deleteUser,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updateProfile,
  User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

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
    views: doc.data().views,
  }));
};

export const getUserDocument = async (userId: string) => {
  const userDoc = await getDoc(doc(db, "users", userId));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    id: userId,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    pushNotificationsEnabled: data.pushNotificationsEnabled,
  };
};

export const updateUserDocument = async (
  user: User,
  firstName: string,
  lastName: string,
  phone: string
) => {
  const userRef = doc(db, "users", user.uid);

  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`,
  });

  await updateDoc(userRef, {
    firstName,
    lastName,
    phone,
  });
};

export const deleteUserAccount = async (password: string) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const removeProperty = httpsCallable(functions, "removeProperty");

  const providerId = user?.providerData[0]?.providerId;
  console.log("Logged in via:", providerId);
  console.log(user?.email);

  if (!user || !user.uid || !user.email)
    throw new Error("Uživatel není přihlášen");

  // Step 1: Reauthenticate
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const userId = user.uid;

  // Step 2: Delete user's properties and subcollections
  const propsQuery = query(
    collection(db, "properties"),
    where("ownerId", "==", userId)
  );
  const propSnapshots = await getDocs(propsQuery);

  for (const propDoc of propSnapshots.docs) {
    const propertyId = propDoc.id;
    // Cloud function removeProperty to delete the property
    try {
      const result = await removeProperty({ propertyId });
      console.log("Property deleted:", result.data);
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  }

  // Step 3: Delete subcollections under users/{userId}
  const favoriteFoldersRef = collection(db, `users/${userId}/favoriteFolders`);
  const favoriteFoldersSnapshot = await getDocs(favoriteFoldersRef);
  for (const folderDoc of favoriteFoldersSnapshot.docs) {
    const folderId = folderDoc.id;
    const propertiesRef = collection(
      db,
      `users/${userId}/favoriteFolders/${folderId}/properties`
    );
    const propertiesSnapshot = await getDocs(propertiesRef);
    for (const propDoc of propertiesSnapshot.docs) {
      await deleteDoc(propDoc.ref);
    }
    await deleteDoc(doc(db, `users/${userId}/favoriteFolders`, folderId));
  }

  // Delete notifications subcollection
  const notificationsRef = collection(db, `users/${userId}/notifications`);
  const notificationsSnapshot = await getDocs(notificationsRef);
  for (const notifDoc of notificationsSnapshot.docs) {
    await deleteDoc(notifDoc.ref);
  }

  // Delete notificationsPreferences subcollection
  const notificationsPreferencesRef = collection(
    db,
    `users/${userId}/notificationsPreferences`
  );
  const notificationsPreferencesSnapshot = await getDocs(
    notificationsPreferencesRef
  );
  for (const notifDoc of notificationsPreferencesSnapshot.docs) {
    await deleteDoc(notifDoc.ref);
  }

  // Step 4: Delete all chats where user is a participant
  const chatsQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId)
  );
  const chatSnapshots = await getDocs(chatsQuery);

  for (const chatDoc of chatSnapshots.docs) {
    const chatId = chatDoc.id;

    // Delete messages
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const messages = await getDocs(messagesRef);
    for (const msg of messages.docs) {
      await deleteDoc(msg.ref);
    }

    // Delete chat document
    await deleteDoc(doc(db, "chats", chatId));
  }

  // Step 5: Delete user document
  await deleteDoc(doc(db, "users", userId));

  // Step 6: Delete Auth user
  await deleteUser(user);
};
