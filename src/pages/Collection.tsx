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
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";

import "../styles/Collection.css";

interface HistoryProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const Collection: React.FC = () => {
  const { get, ready } = useStorage();
  const [viewedHistory, setViewedHistory] = useState<HistoryProps[]>([]);

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

    fetchViewedHistory();
  }, [ready, get]);

  useIonViewDidEnter(() => {
    const fetchViewedHistory = async () => {
      if (!ready) return;

      console.log("useIonViewDidEnter...");

      const history: HistoryProps[] = (await get("viewedHistory")) || [];
      setViewedHistory(history);
    };

    fetchViewedHistory();
  }, [ready, get]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Collection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonAccordionGroup multiple expand="inset">
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

          <IonAccordion value="savedProperties" disabled>
            <IonItem slot="header">
              <IonLabel>Oblíbené Inzeráty</IonLabel>
            </IonItem>
            <div slot="content" className="ion-padding">
              <p>Content</p>
            </div>
          </IonAccordion>

          <IonAccordion value="placeholder2" disabled>
            <IonItem slot="header">
              <IonLabel>Uložené filtry</IonLabel>
            </IonItem>
            <div slot="content" className="ion-padding">
              <p>Content</p>
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      </IonContent>
    </IonPage>
  );
};

export default Collection;
