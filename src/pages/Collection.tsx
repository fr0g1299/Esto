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
  IonImg,
  useIonViewDidEnter,
  IonAccordion,
  IonAccordionGroup,
  IonText,
  IonNote,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";
import { useAuth } from "../hooks/useAuth";

import "../styles/Collection.css";
import { getFavoriteFolders } from "../services/favoritesService";

interface HistoryProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

interface FolderProps {
  id: string;
  title: string;
  propertyCount: number;
}

const Collection: React.FC = () => {
  const { user } = useAuth();
  const { get, ready } = useStorage();
  const [viewedHistory, setViewedHistory] = useState<HistoryProps[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<FolderProps[]>([]);
  const [accordionKey, setAccordionKey] = useState(0);

  // TODO: Implement removal of folders
  useEffect(() => {
    const fetchViewedHistory = async () => {
      if (!ready) return;
      console.log("useeffect...");

      try {
        const history: HistoryProps[] = (await get("viewedHistory")) || [];
        setViewedHistory(history);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    const fetchFavoriteFolders = async () => {
      if (!user) return;
      console.log("useeffect...");

      try {
        setFavoriteFolders(await getFavoriteFolders(user.uid));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchViewedHistory();
    fetchFavoriteFolders();
  }, [ready, get, user]);

  useIonViewDidEnter(() => {
    const fetchViewedHistory = async () => {
      if (!ready) return;

      console.log("useIonViewDidEnter...");

      setAccordionKey((prev) => prev + 1); // TODO: too aggressive
      const history: HistoryProps[] = (await get("viewedHistory")) || [];
      setViewedHistory(history);
    };

    fetchViewedHistory();
  }, [ready, get]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Kolekce</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonAccordionGroup key={accordionKey} multiple expand="inset">
          <IonAccordion value="viewedHistory">
            <IonItem slot="header">
              <IonLabel>Historie zobrazení</IonLabel>
            </IonItem>
            <IonList slot="content">
              {viewedHistory.map((property) => (
                <IonItem
                  key={property.id}
                  routerLink={`/details/${property.id}`}
                >
                  <IonThumbnail slot="start">
                    <IonImg src={property.imageUrl} alt={property.title} />
                  </IonThumbnail>
                  <IonLabel>
                    <h2>{property.title}</h2>
                    <p>{property.price.toLocaleString()} $</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonAccordion>

          <IonAccordion value="savedProperties" disabled={!user}>
            <IonItem slot="header">
              <IonLabel>Složky oblíbených inzerátů</IonLabel>
            </IonItem>
            <IonList slot="content">
              {favoriteFolders.map((folder) => (
                <IonItem
                  key={folder.id}
                  routerLink={`/collection/folder/${folder.id}?name=${folder.title}`}
                >
                  <IonLabel>{folder.title}</IonLabel>
                  <IonNote slot="end">{folder.propertyCount ?? 0}</IonNote>
                </IonItem>
              ))}
            </IonList>
          </IonAccordion>

          <IonAccordion value="placeholder2" disabled={user === null}>
            <IonItem slot="header">
              <IonLabel>Uložené filtry</IonLabel>
            </IonItem>
            <div slot="content" className="ion-padding">
              <p>Content</p>
            </div>
          </IonAccordion>
          <IonAccordion value="userListings" disabled={!user} toggleIcon="">
            <IonItem routerLink="/userListings" slot="header">
              <IonLabel>Moje inzeráty</IonLabel>
            </IonItem>
          </IonAccordion>
          <IonAccordion value="chats" disabled={!user} toggleIcon="">
            <IonItem routerLink="/chats" slot="header">
              <IonLabel>Moje zprávy</IonLabel>
            </IonItem>
          </IonAccordion>
        </IonAccordionGroup>
        {!user && (
          <IonText
            color="danger"
            className="ion-padding ion-align-items-start ion-justify-content-between ion-padding-horizontal"
          >
            <p className="ion-align-items-start ion-justify-content-between ion-padding-horizontal">
              Pro zobrazení oblíbených inzerátů nebo uložených filtrů se musíte
              přihlásit.
            </p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Collection;
