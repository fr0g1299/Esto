import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonImg,
  IonList,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { getUserListings } from "../services/userService";

interface Listing {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const UserListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchListings = async () => {
      const userListings = await getUserListings(user.uid);
      setListings(userListings);
    };
    fetchListings();
  }, [user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Moje inzeráty</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          {listings.map((listing) => (
            <IonItem
              key={listing.id}
              routerLink={`/details/${listing.id}`}
              className="ion-activatable ripple-parent"
            >
              <IonImg
                src={listing.imageUrl}
                slot="start"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  margin: "10px",
                }}
              />
              <IonLabel>
                <h2>{listing.title}</h2>
                <p>{listing.price.toLocaleString("cs")} Kč</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default UserListings;
