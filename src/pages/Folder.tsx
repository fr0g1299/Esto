import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getPropertiesInFolder,
  removePropertyFromFolder,
} from "../services/favoritesService";
import { useParams, useLocation } from "react-router";
import { reorderThreeOutline, trash } from "ionicons/icons";

interface RouteParams {
  folderId: string;
}

interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  disposition: string;
  imageUrl: string;
  note?: string;
}

const Folder: React.FC = () => {
  const { user } = useAuth();
  const { folderId } = useParams<RouteParams>();
  const [properties, setProperties] = React.useState<FavoriteProperty[]>([]);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const name = params.get("name") || "Oblíbené položky";

  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;

      console.log(typeof folderId);
      const properties = await getPropertiesInFolder(user.uid, folderId);
      setProperties(properties);
      console.log(properties);
    };
    fetchProperties();
  }, [user, folderId]);

  const handleRemoveFromFolder = async (propertyId: string) => {
    if (!user) return;
    try {
      await removePropertyFromFolder(user.uid, folderId, propertyId);
      setProperties((prev) =>
        prev.filter((property) => property.id !== propertyId)
      );
    } catch (error) {
      console.error("Error removing property from folder:", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonIcon
              icon={reorderThreeOutline}
              size="large"
              onClick={() => setEdit(!edit)}
            />
          </IonButtons>
          <IonTitle>{name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          {properties.map((property) => (
            <IonItem
              key={property.title}
              routerLink={`/details/${property.id}`}
            >
              <IonThumbnail slot="start">
                <img src={property.imageUrl} alt={property.title} />
              </IonThumbnail>
              <IonLabel>
                <h2>{property.title}</h2>
                <p>{property.price.toLocaleString("cs")} Kč</p>
                <p>{property.disposition}</p>
                {property.note && <IonNote>{property.note}</IonNote>}
              </IonLabel>
              {edit && (
                <IonButton
                  className="delete-button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigation
                    handleRemoveFromFolder(property.id);
                  }}
                >
                  <IonIcon className="trash-icon" icon={trash} />
                </IonButton>
              )}
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Folder;
