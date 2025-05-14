import React, { useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  useIonToast,
  IonLoading,
  IonNote,
} from "@ionic/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

interface Property {
  id: string;
  title: string;
}

interface Trending {
  id: string;
  title: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const AdminDashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [trending, setTrending] = useState<Trending[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const slidingRef = useRef<HTMLIonItemSlidingElement[]>([]);
  const removeProperty = httpsCallable(functions, "removeProperty");
  const [showToast] = useIonToast();
  const [loading, setLoading] = useState(false);

  // Fetch data from Firebase collections
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Properties
        const propertiesSnapshot = await getDocs(collection(db, "properties"));
        setProperties(
          propertiesSnapshot.docs.map((doc) => {
            const data = doc.data() as Partial<Property>;
            return { id: doc.id, title: data.title || "Unnamed Property" };
          })
        );

        // Fetch Trending
        const trendingSnapshot = await getDocs(collection(db, "trending"));
        setTrending(
          trendingSnapshot.docs.map((doc) => {
            const data = doc.data() as Partial<Trending>;
            return { id: doc.id, title: data.title || "Unnamed Trend" };
          })
        );

        // Fetch Users
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(
          usersSnapshot.docs.map((doc) => {
            const data = doc.data() as Partial<User>;
            return {
              id: doc.id,
              email: data.email || "No Email",
              firstName: data.firstName || "No Name",
              lastName: data.lastName || "No Name",
            };
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleRemoveProperty = async (propertyId: string) => {
    setLoading(true);
    try {
      const result = await removeProperty({ propertyId });
      console.log("Property deleted:", result.data);
    } catch (error) {
      console.error("Error deleting property:", error);
    }
    setLoading(false);

    setProperties((prev) =>
      prev.filter((property) => property.id !== propertyId)
    );

    showToast("Inzerát byl úspěšně smazán!", 3000);
  };

  return (
    <IonPage className="admin-dashboard">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Properties</h2>
        <IonList style={{ borderRadius: "15px" }}>
          {properties.map((property, index) => (
            <IonItemSliding key={property.id}>
              <IonItem key={property.id}>
                <IonLabel>{property.title}</IonLabel>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption
                  expandable
                  color="danger"
                  onClick={() => {
                    handleRemoveProperty(property.id);
                    slidingRef.current[index]?.close();
                  }}
                >
                  Odstranit
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        <h2>Trending</h2>
        <IonList style={{ borderRadius: "15px" }}>
          {trending.map((item) => (
            <IonItem key={item.id}>
              <IonLabel>{item.title}</IonLabel>
            </IonItem>
          ))}
        </IonList>

        <h2>Users</h2>
        <IonList style={{ borderRadius: "15px" }}>
          {users.map((user) => (
            <IonItem key={user.id}>
              <IonLabel>{user.email}</IonLabel>
              <IonNote slot="end">
                {user.firstName} {user.lastName}
              </IonNote>
            </IonItem>
          ))}
        </IonList>
        <IonLoading isOpen={loading} message={"Loading..."} />
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
