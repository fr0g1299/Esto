import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
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
import { useAuth } from "../hooks/useAuth";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { hapticsHeavy, hapticsLight } from "../services/haptics";
import {
  deleteNotification,
  fetchNotifications,
  markNotificationAsRead,
} from "../services/notificationsService";
import { Notification } from "../types/interfaces";

import {
  checkmarkCircleOutline,
  homeOutline,
  mailOutline,
  notificationsOutline,
  pricetagOutline,
} from "ionicons/icons";
import "../styles/Notifications.css";

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  useTabBarScrollEffect();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const data = await fetchNotifications(user);

      setNotifications(data);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleClick = async (notification: Notification) => {
    if (!user) return;

    if (!notification.isRead) {
      await markNotificationAsRead(user, notification.id);
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
    await hapticsLight();

    await markNotificationAsRead(user, notificationId);

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) return;
    await hapticsHeavy();

    // Add a "removing" class for animation
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRemoving: true } : notif
      )
    );

    setTimeout(async () => {
      await deleteNotification(user, notificationId);

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
