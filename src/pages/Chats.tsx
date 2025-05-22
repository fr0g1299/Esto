import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonButtons,
  IonBackButton,
  IonImg,
  IonSkeletonText,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { listenToChats } from "../services/chatService";
import { Chat } from "../types/interfaces";

import "../styles/Chats.css";

const Chats: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToChats(user, setChats, setLoading);
    return () => unsubscribe();
  }, [user]);

  return (
    <IonPage className="chats">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>Moje zprávy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          {loading ? (
            <>
              {[...Array(3)].map((_, index) => (
                <IonItem key={index} className="property-item" lines="none">
                  <IonThumbnail slot="start" className="property-thumbnail">
                    <IonSkeletonText
                      animated
                      style={{ width: "100%", height: "100%" }}
                    />
                  </IonThumbnail>
                  <IonLabel className="property-label">
                    <h2>
                      <IonSkeletonText animated style={{ width: "80%" }} />
                    </h2>
                    <p>
                      <IonSkeletonText animated style={{ width: "60%" }} />
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </>
          ) : chats.length === 0 ? (
            <IonItem lines="none" className="property-item">
              <IonLabel className="property-label">
                Nemáte žádné zprávy.
              </IonLabel>
            </IonItem>
          ) : (
            <>
              {chats.map((chat) => (
                <IonItem
                  key={chat.id}
                  button
                  className="property-item"
                  lines="none"
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
                  <IonThumbnail slot="start" className="property-thumbnail">
                    <IonImg src={chat.imageUrl} alt="" />
                  </IonThumbnail>
                  <IonLabel className="property-label">
                    <h2>{chat.title}</h2>
                    <p>{chat.lastMessage || "Začněte konverzaci"}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Chats;
