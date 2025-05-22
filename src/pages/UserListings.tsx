import React, { useState } from "react";
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
  IonThumbnail,
  IonButtons,
  IonBackButton,
  IonSkeletonText,
  useIonViewWillEnter,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { getUserListings } from "../services/userService";
import { Listing } from "../types/interfaces";

import "../styles/UserListings.css";

const UserListings: React.FC = () => {
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useIonViewWillEnter(() => {
    if (!user) return;

    const fetchListings = async () => {
      const userListings = await getUserListings(user.uid);
      setListings(userListings);
    };

    setLoading(true);
    fetchListings();
    setLoading(false);
  }, [user]);

  return (
    <IonPage className="user-listings">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>Mé inzeráty</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          {loading ? (
            [...Array(3)].map((_, index) => (
              <IonItem key={index} className="property-item" lines="none">
                <IonThumbnail slot="start" className="property-thumbnail">
                  <IonSkeletonText
                    animated={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </IonThumbnail>
                <IonLabel className="property-label">
                  <h2>
                    <IonSkeletonText animated={true} style={{ width: "80%" }} />
                  </h2>
                  <p>
                    <IonSkeletonText animated={true} style={{ width: "60%" }} />
                  </p>
                </IonLabel>
              </IonItem>
            ))
          ) : listings.length === 0 ? (
            <IonItem className="property-item" lines="none">
              <IonLabel className="property-label">
                Nemáte žádné vlastní inzeráty.
              </IonLabel>
            </IonItem>
          ) : (
            <>
              {listings.map((listing) => (
                <IonItem
                  key={listing.id}
                  routerLink={`/details/${listing.id}`}
                  className="property-item"
                  lines="none"
                >
                  <IonThumbnail slot="start" className="property-thumbnail">
                    <IonImg src={listing.imageUrl} alt={listing.title} />
                  </IonThumbnail>
                  <IonLabel className="property-label">
                    <h2>{listing.title}</h2>
                    <p>{listing.price.toLocaleString("cs")} Kč</p>
                    <p>{listing.views} zobrazení</p>
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

export default UserListings;
