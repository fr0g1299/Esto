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
  IonSkeletonText,
  IonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getPropertiesInFolder,
  removeFavoriteFolder,
  removePropertyFromFolder,
} from "../services/favoritesService";
import { useParams, useLocation, useHistory } from "react-router";
import { homeOutline, reorderThreeOutline, trash } from "ionicons/icons";

import "../styles/Folder.css";

interface RouteParams {
  folderId: string;
}
// TODO: try haptics
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
  const history = useHistory();
  const [showToast] = useIonToast();
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const name = params.get("name") || "Oblíbené položky";

  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;
      setLoading(true);

      const properties = await getPropertiesInFolder(user.uid, folderId);
      setProperties(properties);
      setLoading(false);
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

  const handleRemove = async () => {
    if (!user) return;

    if (name == "Oblíbené") {
      showToast("Nemůžete vymazat hlavní složku", 2500);
      return;
    }

    try {
      await removeFavoriteFolder(user.uid, folderId);
      history.push("/collections");
    } catch (error) {
      console.error("Failed to remove folder:", error);
      showToast("Smazání složky selhalo.", 2500);
    }
  };

  return (
    <IonPage className="favorite-folder">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          {properties.length !== 0 && (
            <>
              {name !== "Oblíbené" && (
                <IonButtons slot="end">
                  <IonIcon icon={trash} size="large" onClick={handleRemove} />
                </IonButtons>
              )}
              <IonButtons slot="end">
                <IonIcon
                  icon={reorderThreeOutline}
                  size="large"
                  onClick={() => setEdit(!edit)}
                />
              </IonButtons>
            </>
          )}
          <IonTitle>{name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <IonList>
            {[...Array(5)].map((_, index) => (
              <IonItem key={index}>
                <IonThumbnail slot="start">
                  <IonSkeletonText
                    animated={true}
                    style={{ width: "56px", height: "56x" }}
                  />
                </IonThumbnail>
                <IonLabel>
                  <h2>
                    <IonSkeletonText
                      animated={true}
                      style={{ width: "60%", height: "15px" }}
                    />
                  </h2>
                  <p>
                    <IonSkeletonText animated={true} style={{ width: "30%" }} />
                  </p>
                  <p>
                    <IonSkeletonText animated={true} style={{ width: "20%" }} />
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={homeOutline} size="large" color="medium" />
            <h2>Žádné nemovitosti</h2>
            <IonText color="medium">
              <p>
                Tato složka neobsahuje žádné nemovitosti. Přidejte si nějaké
                oblíbené nemovitosti, aby se zde zobrazily.
              </p>
            </IonText>
          </div>
        ) : (
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
                      e.stopPropagation(); // Stop event propagation to IonItem
                      handleRemoveFromFolder(property.id);
                    }}
                  >
                    <IonIcon className="trash-icon" icon={trash} />
                  </IonButton>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Folder;
