import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonThumbnail,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useHistory } from "react-router";

interface Chat {
  id: string;
  title: string;
  propertyId: string;
  lastMessage: string;
  otherUserFirstName: string;
  otherUserLastName: string;
  imageUrl: string;
}

const Chats: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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

        console.log("Other user:", otherUser);
        console.log("Chat data:", data);

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

    return () => unsubscribe();
  }, [user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>Moje zprávy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : chats.length === 0 ? (
          <IonText color="medium">Zatím žádné zprávy.</IonText>
        ) : (
          <IonList>
            {chats.map((chat) => (
              <IonItem
                key={chat.id}
                button
                onClick={() =>
                  history.push({
                    pathname: `/chat/${chat.id}`,
                    state: {
                      userContact: {
                        firstName: chat.otherUserFirstName,
                        lastName: chat.otherUserLastName,
                      },
                      propertyId: chat.propertyId,
                    },
                  })
                }
              >
                <IonThumbnail slot="start">
                  <img src={chat.imageUrl} alt="" />
                </IonThumbnail>
                <IonLabel>
                  <h2>{chat.title}</h2>
                  <p>{chat.lastMessage || "Začněte konverzaci"}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Chats;
