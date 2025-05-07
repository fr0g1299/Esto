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
  IonSkeletonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAlert,
} from "@ionic/react";
import React, { useRef, useState } from "react";
import { useStorage } from "../hooks/useStorage";
import { useAuth } from "../hooks/useAuth";

import "../styles/Collection.css";
import {
  getFavoriteFolders,
  getSavedFilters,
  removeSavedFilter,
} from "../services/favoritesService";

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

interface FilterProps {
  id: string;
  title: string;
  criteria: string;
}

const extractReadableFilters = (query: string): string[] => {
  const params = new URLSearchParams(query);
  const result: string[] = [];

  // Add city, address, type, disposition if present
  ["city", "address", "type", "disposition"].forEach((key) => {
    const value = params.get(key);
    if (value) {
      result.push(`${displayNames[key]}: ${value}`);
    }
  });

  // Add price range
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  if (minPrice || maxPrice) {
    const priceText = `Cena: ${minPrice || 0} - ${maxPrice || "∞"}`;
    result.push(priceText);
  }

  // Add boolean filters
  booleanFilters.forEach((key) => {
    if (params.get(key) === "true") {
      result.push(displayNames[key]);
    }
  });

  return result;
};

const booleanFilters = [
  "garage",
  "elevator",
  "gasConnection",
  "threePhaseElectricity",
  "basement",
  "furnished",
  "balcony",
  "garden",
  "solarPanels",
  "pool",
];

const displayNames: Record<string, string> = {
  // Boolean filters
  garage: "Garáž",
  elevator: "Výtah",
  gasConnection: "Plyn",
  threePhaseElectricity: "Třífázový proud",
  basement: "Sklep",
  furnished: "Zařízený",
  balcony: "Balkón",
  garden: "Zahrada",
  solarPanels: "Solární panely",
  pool: "Bazén",
  // Other filters
  city: "Město",
  address: "Adresa",
  type: "Typ",
  disposition: "Dispozice",
  minPrice: "Cena od",
  maxPrice: "Cena do",
};

const Collection: React.FC = () => {
  const { user } = useAuth();
  const { get, ready } = useStorage();
  const [viewedHistory, setViewedHistory] = useState<HistoryProps[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<FolderProps[]>([]);
  const [accordionKey, setAccordionKey] = useState(0);
  const [savedFilters, setSavedFilters] = useState<FilterProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState("");

  const [folderExpanded, setFolderExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const slidingRef = useRef<HTMLIonItemSlidingElement | null>(null);

  useIonViewDidEnter(() => {
    setAccordionKey((prev) => prev + 1); // TODO: too aggressive
  }, []);

  const handleViewedHistory = async () => {
    if (!ready) return;
    const newValue = !historyExpanded;
    setHistoryExpanded(newValue);

    if (!historyExpanded) {
      setLoading(true);

      try {
        const history: HistoryProps[] = (await get("viewedHistory")) || [];
        setViewedHistory(history);
      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFavoriteFolders = async () => {
    if (!user) return;
    const newValue = !folderExpanded;
    setFolderExpanded(newValue);

    if (!folderExpanded) {
      setLoading(true);

      try {
        setFavoriteFolders(await getFavoriteFolders(user.uid));
      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavedFilter = async () => {
    if (!user) return;
    if (savedFilters.length > 0) return;
    const newValue = !filtersExpanded;
    setFiltersExpanded(newValue);

    if (!filtersExpanded) {
      setLoading(true);

      try {
        const filters = await getSavedFilters(user?.uid);
        setSavedFilters(filters);
      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveFilter = async (filterId: string) => {
    if (!user) return;
    try {
      await removeSavedFilter(user.uid, filterId);

      setSavedFilters((prev) =>
        prev.filter((filter) => filter.id !== filterId)
      );
    } catch (error) {
      console.error("Error removing filter:", error);
    }
  };

  return (
    <IonPage className="collections">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Kolekce</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonAccordionGroup key={accordionKey} multiple expand="inset">
          <IonAccordion value="viewedHistory" onClick={handleViewedHistory}>
            <IonItem slot="header">
              <IonLabel>Historie zobrazení</IonLabel>
            </IonItem>
            <IonList slot="content">
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
                        <IonSkeletonText
                          animated={true}
                          style={{ width: "80%" }}
                        />
                      </h2>
                      <p>
                        <IonSkeletonText
                          animated={true}
                          style={{ width: "60%" }}
                        />
                      </p>
                    </IonLabel>
                  </IonItem>
                ))
              ) : !viewedHistory || viewedHistory.length === 0 ? (
                <IonItem lines="none">
                  <IonLabel>Nemáte žádnou historii zobrazení.</IonLabel>
                </IonItem>
              ) : (
                <>
                  {viewedHistory.map((property) => (
                    <IonItem
                      key={property.id}
                      routerLink={`/details/${property.id}`}
                      className="property-item"
                      lines="none"
                    >
                      <IonThumbnail slot="start" className="property-thumbnail">
                        <IonImg src={property.imageUrl} alt={property.title} />
                      </IonThumbnail>
                      <IonLabel className="property-label">
                        <h2>{property.title}</h2>
                        <p>{property.price.toLocaleString()} $</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </>
              )}
            </IonList>
          </IonAccordion>

          <IonAccordion
            value="savedProperties"
            disabled={!user}
            onClick={handleFavoriteFolders}
          >
            <IonItem slot="header">
              <IonLabel>Složky oblíbených inzerátů</IonLabel>
            </IonItem>
            <IonList slot="content">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <IonItem key={index} className="folder-item" lines="none">
                    <IonLabel className="property-label">
                      <h2>
                        <IonSkeletonText animated style={{ width: "80%" }} />
                      </h2>
                    </IonLabel>
                    <IonNote slot="end" className="property-count">
                      <IonSkeletonText animated style={{ width: "7px" }} />
                    </IonNote>
                  </IonItem>
                ))
              ) : (
                <>
                  {favoriteFolders.map((folder) => (
                    <IonItem
                      key={folder.id}
                      routerLink={`/collection/folder/${folder.id}?name=${folder.title}`}
                      className="folder-item"
                      lines="none"
                    >
                      <IonLabel className="property-label">
                        <h2>{folder.title}</h2>
                      </IonLabel>
                      <IonNote slot="end" className="property-count">
                        {folder.propertyCount ?? 0}
                      </IonNote>
                    </IonItem>
                  ))}
                </>
              )}
            </IonList>
          </IonAccordion>

          <IonAccordion
            value="savedFilters"
            disabled={user === null}
            onClick={handleSavedFilter}
          >
            <IonItem slot="header">
              <IonLabel>Uložené filtry</IonLabel>
            </IonItem>
            <IonList slot="content">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <div key={index}>
                    <IonItem className="filter-item" lines="none">
                      <IonLabel className="filter-label">
                        <IonSkeletonText animated style={{ width: "60%" }} />
                      </IonLabel>
                    </IonItem>
                    <IonItem className="filter-note-item" lines="none">
                      <IonNote className="filter-criteria">
                        <IonSkeletonText animated style={{ width: "80%" }} />
                      </IonNote>
                    </IonItem>
                  </div>
                ))
              ) : !savedFilters || savedFilters.length === 0 ? (
                <IonItem lines="none">
                  <IonLabel>Nemáte žádné uložené filtry.</IonLabel>
                </IonItem>
              ) : (
                <>
                  {savedFilters.map((filter) => (
                    <div key={filter.id} className="filter-item-wrapper">
                      <IonItemSliding
                        ref={(el) => {
                          if (filter.id === activeFilterId) {
                            slidingRef.current = el;
                          }
                        }}
                      >
                        <IonItemOptions
                          side="start"
                          onIonSwipe={() => {
                            setActiveFilterId(filter.id);
                            setShowAlert(true);
                          }}
                        >
                          <IonItemOption expandable>Odstranit</IonItemOption>
                        </IonItemOptions>
                        <IonItem
                          key={filter.id}
                          routerLink={`/results?${filter.criteria}`}
                          className="filter-item"
                          lines="none"
                        >
                          <IonLabel className="filter-label">
                            {filter.title}
                          </IonLabel>
                        </IonItem>
                      </IonItemSliding>
                      <IonItem
                        key={filter.id}
                        routerLink={`/results?${filter.criteria}`}
                        className="filter-note-item"
                        lines="none"
                      >
                        <IonNote className="filter-criteria">
                          {extractReadableFilters(filter.criteria).join(", ")}
                        </IonNote>
                      </IonItem>
                    </div>
                  ))}
                </>
              )}
            </IonList>
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

        <IonAlert
          header="Opravdu chcete odstranit tento filtr?"
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          buttons={[
            {
              text: "Ne",
              role: "cancel",
              handler: () => {
                slidingRef.current?.close();
              },
            },
            {
              text: "Ano",
              role: "confirm",
              handler: () => {
                handleRemoveFilter(activeFilterId);
              },
            },
          ]}
        ></IonAlert>
      </IonContent>
    </IonPage>
  );
};

export default Collection;
