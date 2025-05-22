import { db } from "../firebase";
import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  getDoc,
  addDoc,
  serverTimestamp,
  where,
  orderBy,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

import { functions } from "../firebase";
import { httpsCallable } from "firebase/functions";

import { Preferences } from "@capacitor/preferences";
import { User } from "firebase/auth";
import { Notification, NotificationPreference } from "../types/interfaces";

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
    key: "pushEnabled",
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

export const fetchUnreadNotificationCount = async (
  user: User | null
): Promise<number> => {
  if (!user) return 0;

  const unreadQuery = query(
    collection(db, "users", user.uid, "notifications"),
    where("isRead", "==", false)
  );

  const snapshot = await getDocs(unreadQuery);
  return snapshot.size;
};

export const fetchNotifications = async (
  user: User | null
): Promise<Notification[]> => {
  if (!user) return [];

  const q = query(
    collection(db, "users", user.uid, "notifications"),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Notification, "id">),
  }));

  return data;
};

export const markNotificationAsRead = async (
  user: User | null,
  notificationId: string
): Promise<void> => {
  if (!user || !notificationId) {
    throw new Error("User and notification ID are required");
  }

  await updateDoc(doc(db, "users", user.uid, "notifications", notificationId), {
    isRead: true,
  });
};

export const deleteNotification = async (
  user: User | null,
  notificationId: string
): Promise<void> => {
  if (!user || !notificationId) {
    throw new Error("User and notification ID are required");
  }

  await deleteDoc(doc(db, "users", user.uid, "notifications", notificationId));
};

export const setNotificationProperty = async (
  user: User | null,
  propertyId: string,
  notificationPreference: NotificationPreference
): Promise<void> => {
  if (!user || !propertyId || !notificationPreference) {
    throw new Error(
      "User, property ID, and notification preference are required"
    );
  }

  try {
    await setDoc(
      doc(db, "users", user.uid, "notificationsPreferences", propertyId),
      notificationPreference
    );
  } catch (error) {
    console.error("Error setting notification preference:", error);
    throw error;
  }
};

export const deleteNotificationProperty = async (
  user: User | null,
  propertyId: string
): Promise<void> => {
  if (!user || !propertyId) {
    throw new Error("User and property ID are required");
  }

  try {
    await deleteDoc(
      doc(db, "users", user.uid, "notificationsPreferences", propertyId)
    );
  } catch (error) {
    console.error("Error deleting notification preference:", error);
    throw error;
  }
};
