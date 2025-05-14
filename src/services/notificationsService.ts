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

    const prefSnap = await getDoc(
      doc(db, "users", userId, "notificationsPreferences", propertyId)
    );

    if (!prefSnap.exists() || !prefSnap.data().notifyOnPriceDrop) continue;

    // In-app notification
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Snížení ceny!",
      message: `Inzerát má novou cenu: ${newPrice.toLocaleString("cs")} Kč`,
      type: "price-drop",
      actionId: propertyId,
      actionUrl: `/details/${propertyId}`,
      isRead: false,
      timestamp: serverTimestamp(),
    });

    if (!userData.pushNotificationsEnabled || !userData.pushToken) continue;

    // Push notification
    await pushNotification({
      to: userData.pushToken,
      title: "Snížení ceny!",
      body: `Inzerát má novou cenu: ${newPrice.toLocaleString("cs")} Kč`,
      payload: { propertyId },
    });
  }
};

export const sendMessageNotification = async (
  chatId: string,
  senderId: string,
  text: string
) => {
  const chatSnap = await getDoc(doc(db, "chats", chatId));
  const chatData = chatSnap.data();

  if (!chatData || !chatData.participants) return;

  const recipients = chatData.participants.filter(
    (uid: string) => uid !== senderId
  );

  for (const userId of recipients) {
    const userSnap = await getDoc(doc(db, "users", userId));
    const userData = userSnap.data();

    // In-app notification
    await addDoc(collection(db, "users", userId, "notifications"), {
      title: "Nová zpráva",
      message: text.length > 50 ? text.slice(0, 50) + "..." : text,
      type: "message",
      actionId: chatId,
      actionUrl: `/chat/${chatId}`,
      isRead: false,
      timestamp: serverTimestamp(),
    });

    if (!userData?.pushNotificationsEnabled || !userData.pushToken) continue;

    // Push notification
    await pushNotification({
      to: userData.pushToken,
      title: "Nová zpráva",
      body: text.length > 50 ? text.slice(0, 50) + "..." : text,
      payload: { chatId },
    });
  }
};
