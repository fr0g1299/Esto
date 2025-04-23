import { Preferences } from "@capacitor/preferences";
import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export const setNotificationPreference = async (
  userId: string,
  value: boolean
) => {
  // Save to Firestore
  await updateDoc(doc(db, "users", userId), {
    pushNotificationsEnabled: value,
  });

  // Save to local device storage
  await Preferences.set({
    key: "pushNotificationsEnabled",
    value: value.toString(),
  });
};

const pushNotification = httpsCallable(functions, "sendPushNotification");

export const sendPriceDropNotification = async (
  propertyId: string,
  newPrice: number
) => {
  const userQuery = query(collection(db, "users"));
  const usersSnap = await getDocs(userQuery);

  for (const docSnap of usersSnap.docs) {
    const userId = docSnap.id;
    const userData = docSnap.data();

    if (!userData.pushNotificationsEnabled || !userData.pushToken) continue;

    const prefSnap = await getDoc(
      doc(db, "users", userId, "notificationsPreferences", propertyId)
    );

    if (!prefSnap.exists() || !prefSnap.data().notifyOnPriceDrop) continue;

    // 1. Send Push Notification
    await pushNotification({
      to: userData.pushToken,
      title: "Snížení ceny!",
      body: `Inzerát má novou cenu: ${newPrice.toLocaleString("cs")} Kč`,
      payload: { propertyId }, // can be used for deep linking
    });

    // 2. Store In-App Notification in Firestore
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Snížení ceny!",
      message: `Inzerát má novou cenu: ${newPrice.toLocaleString("cs")} Kč`,
      type: "price-drop",
      actionId: propertyId,
      actionUrl: `/details/${propertyId}`,
      isRead: false,
      timestamp: serverTimestamp(),
    });
  }
};
