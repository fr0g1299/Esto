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
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { useHistory } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Timestamp;
  isRead: boolean;
  actionId?: string;
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
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

    if (notification.actionUrl) {
      history.push(notification.actionUrl);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifikace</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading ? (
          <IonSpinner className="ion-margin" />
        ) : notifications.length === 0 ? (
          <IonLabel className="ion-padding">Žádné notifikace</IonLabel>
        ) : (
          <IonList>
            {notifications.map((notif) => (
              <IonItem
                key={notif.id}
                button
                onClick={() => handleClick(notif)}
                detail={!!notif.actionUrl}
              >
                <IonLabel>
                  <h2>{notif.title}</h2>
                  <p>{notif.message}</p>
                  <IonNote>
                    {new Date(notif.timestamp?.toDate?.()).toLocaleString("cs")}
                  </IonNote>
                </IonLabel>
                {!notif.isRead && <IonBadge color="danger">Nové</IonBadge>}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
