import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonAvatar,
  IonIcon,
  IonSkeletonText,
  IonText,
  IonButton,
} from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { useHistory } from "react-router-dom";

import "../styles/Notifications.css";
import {
  checkmarkCircleOutline,
  homeOutline,
  mailOutline,
  notificationsOutline,
  pricetagOutline,
} from "ionicons/icons";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Timestamp;
  isRead: boolean;
  isRemoving?: boolean;
  actionId?: string;
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  useTabBarScrollEffect();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const q = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Notification, "id">),
      }));
      console.log(data);
      setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();
  }, [user]);

  const handleClick = async (notification: Notification) => {
    if (!user) return;

    if (!notification.isRead) {
      await updateDoc(
        doc(db, "users", user.uid, "notifications", notification.id),
        { isRead: true }
      );
    }

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notification.id ? { ...notif, isRead: true } : notif
      )
    );

    if (notification.actionUrl) {
      history.push(notification.actionUrl);
    }
  };

  const handleSeen = async (notificationId: string) => {
    if (!user) return;

    await updateDoc(
      doc(db, "users", user.uid, "notifications", notificationId),
      {
        isRead: true,
      }
    );

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) return;

    // Add a "removing" class for animation
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRemoving: true } : notif
      )
    );

    setTimeout(async () => {
      await deleteDoc(
        doc(db, "users", user.uid, "notifications", notificationId)
      );

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    }, 300);
  };

  const slidingRef = useRef<HTMLIonItemSlidingElement[]>([]);

  const getIcon = (type: string) => {
    if (type === "price-drop") return pricetagOutline;
    if (type === "system") return checkmarkCircleOutline;
    if (type === "message") return mailOutline;
    return notificationsOutline; // Default icon
  };

  return (
    <IonPage className="notifications">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifikace</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen scrollEvents>
        {loading ? (
          <IonItem lines="none" className="notification-item skeleton">
            <IonAvatar slot="start" className="notification-avatar">
              <IonSkeletonText
                animated
                style={{ width: "40px", height: "40px", borderRadius: "50%" }}
              />
            </IonAvatar>

            <IonLabel className="notification-label">
              <h2 className="notification-title">
                <IonSkeletonText
                  animated
                  style={{ width: "60%", height: "16px" }}
                />
              </h2>
              <p className="notification-message">
                <IonSkeletonText
                  animated
                  style={{ width: "80%", height: "14px" }}
                />
              </p>
              <IonNote className="notification-timestamp">
                <IonSkeletonText
                  animated
                  style={{ width: "40%", height: "12px" }}
                />
              </IonNote>
            </IonLabel>
          </IonItem>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={notificationsOutline} size="large" color="medium" />
            <h2>Žádné notifikace</h2>
            <IonText color="medium">
              <p>
                Nemáte žádné notifikace. Jakmile obdržíte novou notifikaci,
                zobrazí se zde.
              </p>
            </IonText>
            <IonButton
              expand="block"
              onClick={() => history.push("/home")}
              className="ion-margin-top"
            >
              <IonIcon icon={homeOutline} slot="start" className="icon-align" />
              Zpět na domovskou stránku
            </IonButton>
          </div>
        ) : (
          <IonList>
            {notifications.map((notif, index) => (
              <IonItemSliding
                key={notif.id}
                ref={(el) => {
                  if (el) slidingRef.current[index] = el;
                }}
              >
                {!notif.isRead && (
                  <IonItemOptions
                    side="start"
                    onIonSwipe={() => {
                      handleSeen(notif.id);
                      slidingRef.current[index]?.close();
                    }}
                  >
                    <IonItemOption expandable color="success">
                      Přečteno
                    </IonItemOption>
                  </IonItemOptions>
                )}

                <IonItem
                  key={notif.id}
                  button
                  onClick={() => handleClick(notif)}
                  detail={!!notif.actionUrl}
                  className={`notification-item ${
                    notif.isRead ? "read" : "unread"
                  } ${notif.isRemoving ? "removing" : ""}`}
                  lines="none"
                >
                  <IonAvatar slot="start" className="notification-avatar">
                    <IonIcon
                      icon={getIcon(notif.type)}
                      size="large"
                      color={notif.isRead ? "medium" : "primary"}
                    />
                  </IonAvatar>

                  <IonLabel className="notification-label">
                    <h2
                      className={`notification-title ${
                        notif.isRead ? "read" : "unread"
                      }`}
                    >
                      {notif.title}
                    </h2>
                    <p className="notification-message">{notif.message}</p>
                    <IonNote
                      className={`notification-timestamp ${
                        notif.isRead ? "read" : "unread"
                      }`}
                    >
                      {new Date(notif.timestamp?.toDate?.()).toLocaleString(
                        "cs"
                      )}
                    </IonNote>
                  </IonLabel>
                </IonItem>

                <IonItemOptions
                  side="end"
                  onIonSwipe={() => {
                    handleDelete(notif.id);
                    slidingRef.current[index]?.close();
                  }}
                >
                  <IonItemOption expandable color="danger">
                    Odstranit
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
