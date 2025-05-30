import { db } from "../firebase";
import {
  collection,
  query,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  onSnapshot,
  orderBy,
  Timestamp,
  getDoc,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";

import { sendMessageNotification } from "./notificationsService";
import { Chat } from "../types/interfaces";

const generateChatId = (user1: string, user2: string, propertyId: string) => {
  const sortedUsers = [user1, user2].sort();
  return `${sortedUsers[0]}_${sortedUsers[1]}_${propertyId}`;
};

export const getOrCreateChat = async (
  user1: string,
  user2: string,
  propertyId: string,
  title?: string,
  imageUrl?: string
) => {
  const chatId = generateChatId(user1, user2, propertyId);
  const chatDocRef = doc(db, "chats", chatId);

  const chatDoc = await getDoc(chatDocRef);

  if (chatDoc.exists()) {
    return chatDoc.id; // Chat already exists
  }

  // Fetch user details
  const user1Doc = await getDoc(doc(db, "users", user1));
  const user2Doc = await getDoc(doc(db, "users", user2));

  const user1Data = user1Doc.data();
  const user2Data = user2Doc.data();

  // Create new chat with the specific document ID
  await setDoc(chatDocRef, {
    participants: [user1, user2],
    participantDetails: {
      [user1]: {
        firstName: user1Data?.firstName || "",
        lastName: user1Data?.lastName || "",
      },
      [user2]: {
        firstName: user2Data?.firstName || "",
        lastName: user2Data?.lastName || "",
      },
    },
    propertyId,
    title,
    imageUrl,
    lastMessage: "",
    lastTimestamp: serverTimestamp(),
  });

  return chatId;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  text: string
) => {
  const messageRef = collection(db, `chats/${chatId}/messages`);
  await addDoc(messageRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });

  await setDoc(
    doc(db, "chats", chatId),
    {
      lastMessage: text,
      lastTimestamp: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await sendMessageNotification(chatId, senderId, text);
  } catch (error) {
    console.error("Error sending message notification:", error);
  }
};

export const subscribeToMessages = (
  chatId: string,
  callback: (
    messages: {
      id: string;
      senderId: string;
      text: string;
      timestamp: Timestamp;
    }[]
  ) => void
) => {
  const q = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        senderId: data.senderId as string,
        text: data.text as string,
        timestamp: data.timestamp as Timestamp,
      };
    });
    callback(messages);
  });
};

export const listenToChats = (
  user: User | null,
  setChats: (chats: Chat[]) => void,
  setLoading: (loading: boolean) => void
) => {
  if (!user) return () => {};

  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participants", "array-contains", user.uid),
    orderBy("lastTimestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const chatsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      const participantDetails = data.participantDetails || {};

      // Remove current user from participants
      const otherUserId = Object.keys(participantDetails).find(
        (id) => id !== user.uid
      );

      // Get other user's details
      const otherUser = otherUserId
        ? participantDetails[otherUserId]
        : { firstName: "Chat", lastName: "" };

      return {
        id: doc.id,
        title: data.title as string,
        propertyId: data.propertyId as string,
        lastMessage: data.lastMessage as string,
        imageUrl: data.imageUrl,
        otherUserFirstName: otherUser.firstName,
        otherUserLastName: otherUser.lastName,
      };
    });

    setChats(chatsData);
    setLoading(false);
  });

  return unsubscribe;
};
