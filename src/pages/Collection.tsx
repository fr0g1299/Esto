import { useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonImg,
  IonAccordion,
  IonAccordionGroup,
  IonText,
  IonNote,
  IonSkeletonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAlert,
  useIonViewDidLeave,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { useStorage } from "../hooks/useStorage";
import {
  getFavoriteFolders,
  getSavedFilters,
  removeSavedFilter,
} from "../services/favoritesService";
import { hapticsHeavy, hapticsLight } from "../services/haptics";
import { getNotificationProperties } from "../services/propertyService";
import {
  OfflineProperty,
  HistoryProps,
  FilterProps,
  FolderProps,
  PropertyDetailsData,
  NotificationProps,
} from "../types/interfaces";

import "../styles/Collection.css";

const extractReadableFilters = (query: string): string[] => {
  const params = new URLSearchParams(query);
  const result: string[] = [];

  // Add city, address, type, disposition if present
  ["city", "address", "radius", "type", "disposition"].forEach((key) => {
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
  radius: "Rádius",
  type: "Typ",
  disposition: "Dispozice",
  minPrice: "Cena od",
  maxPrice: "Cena do",
};

const Collection: React.FC = () => {
  const { user } = useAuth();
  const { set, get, ready } = useStorage();
  const slidingRef = useRef<HTMLIonItemSlidingElement | null>(null);

  const [offlineProperties, setOfflineProperties] = useState<OfflineProperty[]>(
    []
  );
  const [viewedHistory, setViewedHistory] = useState<HistoryProps[]>([]);
  const [favoriteFolders, setFavoriteFolders] = useState<FolderProps[]>([]);
  const [accordionKey, setAccordionKey] = useState(0);
  const [savedFilters, setSavedFilters] = useState<FilterProps[]>([]);
  const [notificationsPreferences, setNotificationsPreferences] = useState<
    NotificationProps[]
  >([]);
  const [loadingLevels, setLoadingLevels] = useState({
    viewedHistory: true,
    favoriteFolders: true,
    savedFilters: true,
    offlineProperties: true,
    notificationsPreferences: true,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState("");

  const [folderExpanded, setFolderExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [offlineExpanded, setOfflineExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  useIonViewDidLeave(() => {
    setAccordionKey((prev) => prev + 1);
  }, []);

  const handleViewedHistory = async () => {
    if (!ready) return;
    await hapticsLight();
    const newValue = !historyExpanded;
    setHistoryExpanded(newValue);

    if (!historyExpanded) {
      setLoadingLevels((prev) => ({ ...prev, viewedHistory: true }));

      try {
        const history: HistoryProps[] = (await get("viewedHistory")) || [];
        setViewedHistory(history);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoadingLevels((prev) => ({ ...prev, viewedHistory: false }));
      }
    }
  };

  const handleFavoriteFolders = async () => {
    if (!user) return;
    await hapticsLight();
    const newValue = !folderExpanded;
    setFolderExpanded(newValue);

    if (!folderExpanded) {
      setLoadingLevels((prev) => ({ ...prev, favoriteFolders: true }));

      try {
        setFavoriteFolders(await getFavoriteFolders(user.uid));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoadingLevels((prev) => ({ ...prev, favoriteFolders: false }));
      }
    }
  };

  const handleSavedFilter = async () => {
    if (!user) return;
    await hapticsLight();
    if (savedFilters.length > 0) return;
    const newValue = !filtersExpanded;
    setFiltersExpanded(newValue);

    if (!filtersExpanded) {
      setLoadingLevels((prev) => ({ ...prev, savedFilters: true }));

      try {
        const filters = await getSavedFilters(user?.uid);
        setSavedFilters(filters);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoadingLevels((prev) => ({ ...prev, savedFilters: false }));
      }
    }
  };

  const handleOfflineProperties = async () => {
    if (!ready) return;
    await hapticsLight();
    const newValue = !offlineExpanded;
    setOfflineExpanded(newValue);
    setLoadingLevels((prev) => ({ ...prev, offlineProperties: true }));

    if (!offlineExpanded) {
      const offlineData = await get("properties");
      if (offlineData) setOfflineProperties(offlineData);
      setLoadingLevels((prev) => ({ ...prev, offlineProperties: false }));
    }
  };

  const handleRemoveOffline = async (propertyId: string) => {
    await hapticsHeavy();

    try {
      const updatedProperties = offlineProperties.filter(
        (property) => property.propertyId !== propertyId
      );
      setOfflineProperties(updatedProperties);
      await set("properties", updatedProperties);

      const detailsMap: Record<string, PropertyDetailsData> =
        (await get("detailsMap")) || {};
      delete detailsMap[propertyId];
      await set("detailsMap", detailsMap);
    } catch (error) {
      console.error("Error removing offline property:", error);
    }
  };

  const handleRemoveFilter = async (filterId: string) => {
    if (!user) return;
    await hapticsHeavy();
    try {
      await removeSavedFilter(user.uid, filterId);

      setSavedFilters((prev) =>
        prev.filter((filter) => filter.id !== filterId)
      );
    } catch (error) {
      console.error("Error removing filter:", error);
    }
  };

  const handleNotificationPreferences = async () => {
    if (!user) return;
    await hapticsLight();
    const newValue = !notificationsExpanded;
    setNotificationsExpanded(newValue);

    if (!notificationsExpanded) {
      setLoadingLevels((prev) => ({ ...prev, notificationsPreferences: true }));

      try {
        setNotificationsPreferences(await getNotificationProperties(user.uid));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoadingLevels((prev) => ({
          ...prev,
          notificationsPreferences: false,
        }));
      }
    }
  };

  return (
    <IonPage className="collections">
      <IonContent fullscreen className="ion-padding">
        <IonAccordionGroup key={accordionKey} multiple expand="inset">
          <IonAccordion value="viewedHistory" onClick={handleViewedHistory}>
            <IonItem slot="header">
              <IonLabel>Historie zobrazení</IonLabel>
            </IonItem>
            <IonList slot="content">
              {loadingLevels.viewedHistory ? (
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
                <IonItem lines="none" className="property-item">
                  <IonLabel className="property-label">
                    Nemáte žádnou historii zobrazení.
                  </IonLabel>
                </IonItem>
              ) : (
                <>
                  {viewedHistory.map((property) => (
                    <IonItem
                      key={property.propertyId}
                      routerLink={`/details/${property.propertyId}`}
                      className="property-item"
                      lines="none"
                    >
                      <IonThumbnail slot="start" className="property-thumbnail">
                        <IonImg src={property.imageUrl} alt={property.title} />
                      </IonThumbnail>
                      <IonLabel className="property-label">
                        <h2>{property.title}</h2>
                        <p>{property.price.toLocaleString("cs")} Kč</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </>
              )}
            </IonList>
          </IonAccordion>

          <IonAccordion value="offline" onClick={handleOfflineProperties}>
            <IonItem slot="header">
              <IonLabel>Uložené nemovitosti</IonLabel>
            </IonItem>
            <IonList slot="content">
              {loadingLevels.offlineProperties ? (
                [...Array(1)].map(
                  (
                    _,
                    index //Array for future updates
                  ) => (
                    <IonItem key={index} className="property-item" lines="none">
                      <IonLabel className="property-label">
                        <h2>
                          <IonSkeletonText animated style={{ width: "80%" }} />
                        </h2>
                        <p>
                          <IonSkeletonText animated style={{ width: "60%" }} />
                        </p>
                      </IonLabel>
                    </IonItem>
                  )
                )
              ) : !offlineProperties || offlineProperties.length === 0 ? (
                <IonItem lines="none" className="property-item">
                  <IonLabel className="property-label">
                    Nemáte žádné uložené nemovitosti.
                  </IonLabel>
                </IonItem>
              ) : (
                <>
                  {offlineProperties.map((property) => (
                    <IonItemSliding
                      key={property.propertyId}
                      ref={(el) => {
                        if (property.propertyId === activeFilterId) {
                          slidingRef.current = el;
                        }
                      }}
                    >
                      <IonItemOptions
                        side="end"
                        onIonSwipe={() => {
                          setActiveFilterId(property.propertyId);
                          setShowAlert(true);
                        }}
                      >
                        <IonItemOption expandable>Odstranit</IonItemOption>
                      </IonItemOptions>
                      <IonItem
                        key={property.propertyId}
                        routerLink={`/offline/${property.propertyId}`}
                        className="property-item"
                        lines="none"
                      >
                        <IonLabel className="property-label">
                          <h2>{property.title}</h2>
                          <p>{property.price.toLocaleString("cs")} Kč</p>
                        </IonLabel>
                      </IonItem>
                    </IonItemSliding>
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
              {loadingLevels.favoriteFolders ? (
                [...Array(2)].map((_, index) => (
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
              {loadingLevels.savedFilters ? (
                [...Array(1)].map(
                  (
                    _,
                    index //Array for future updates
                  ) => (
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
                  )
                )
              ) : !savedFilters || savedFilters.length === 0 ? (
                <IonItem lines="none" className="property-item">
                  <IonLabel className="property-label">
                    Nemáte žádné uložené filtry.
                  </IonLabel>
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
                          side="end"
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

          <IonAccordion
            value="notificationPreferences"
            disabled={user === null}
            onClick={handleNotificationPreferences}
          >
            <IonItem slot="header">
              <IonLabel>Notifikace o změně ceny</IonLabel>
            </IonItem>
            <IonList slot="content">
              {loadingLevels.notificationsPreferences ? (
                [...Array(3)].map((_, index) => (
                  <IonItem key={index} className="property-item" lines="none">
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
              ) : !notificationsPreferences ||
                notificationsPreferences.length === 0 ? (
                <IonItem lines="none" className="property-item">
                  <IonLabel className="property-label">
                    Nemáte nastavené žádné notifikace.
                  </IonLabel>
                </IonItem>
              ) : (
                <>
                  {notificationsPreferences.map((property) => (
                    <IonItem
                      key={property.id}
                      routerLink={`/details/${property.id}`}
                      className="property-item"
                      lines="none"
                    >
                      <IonLabel className="property-label">
                        <h2>{property.title}</h2>
                        <p>{property.price.toLocaleString("cs")} Kč</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </>
              )}
            </IonList>
          </IonAccordion>

          <IonAccordion value="userListings" disabled={!user} toggleIcon="">
            <IonItem routerLink="/userListings" slot="header">
              <IonLabel>Mé inzeráty</IonLabel>
            </IonItem>
          </IonAccordion>
          <IonAccordion value="chats" disabled={!user} toggleIcon="">
            <IonItem routerLink="/chats" slot="header">
              <IonLabel>Mé zprávy</IonLabel>
            </IonItem>
          </IonAccordion>
        </IonAccordionGroup>
        {!user && (
          <IonText color="medium" className="center-text">
            <p>
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

        <IonAlert
          header="Opravdu chcete odstranit tuto uloženou nemovitost?"
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
                handleRemoveOffline(activeFilterId);
              },
            },
          ]}
        ></IonAlert>
      </IonContent>
    </IonPage>
  );
};

export default Collection;
