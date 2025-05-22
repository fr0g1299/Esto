import { useEffect, useState, useMemo } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonBackButton,
  IonButtons,
  IonSkeletonText,
  IonIcon,
  IonButton,
  useIonToast,
  IonAlert,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { saveFavoriteFilter } from "../services/favoritesService";
import { hapticsHeavy, hapticsLight } from "../services/haptics";
import { PropertySearchResults, SearchQueryParams } from "../types/interfaces";

import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import {
  homeOutline,
  mapOutline,
  searchOutline,
  starOutline,
} from "ionicons/icons";
import "../styles/SearchResults.css";
import { fetchPropertySearchResults } from "../services/propertyService";

const useQueryParams = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const SearchResults: React.FC = () => {
  const { user } = useAuth();
  const [showToast] = useIonToast();
  const history = useHistory();
  useTabBarScrollEffect();

  const queryParams = useQueryParams();

  const [properties, setProperties] = useState<PropertySearchResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 5;

  const fetchResults = async (isPaginating = false) => {
    if (!isPaginating) {
      setLoading(true);
    }

    try {
      console.log("Fetching");
      // Convert queryParams to SearchQueryParams
      const params: SearchQueryParams = {
        city: queryParams.get("city") || undefined,
        address: queryParams.get("address") || undefined,
        radius: queryParams.get("radius") || undefined,
        type: queryParams.get("type") || undefined,
        disposition: queryParams.get("disposition") || undefined,
        minPrice: queryParams.get("minPrice") || undefined,
        maxPrice: queryParams.get("maxPrice") || undefined,
        garage: queryParams.get("garage") || undefined,
        elevator: queryParams.get("elevator") || undefined,
        gasConnection: queryParams.get("gasConnection") || undefined,
        threePhaseElectricity:
          queryParams.get("threePhaseElectricity") || undefined,
        basement: queryParams.get("basement") || undefined,
        furnished: queryParams.get("furnished") || undefined,
        balcony: queryParams.get("balcony") || undefined,
        garden: queryParams.get("garden") || undefined,
        solarPanels: queryParams.get("solarPanels") || undefined,
        pool: queryParams.get("pool") || undefined,
      };

      const {
        properties: results,
        lastDoc: newLastDoc,
        hasMore,
      } = await fetchPropertySearchResults(
        params,
        lastDoc,
        PAGE_SIZE,
        isPaginating
      );

      if (isPaginating) {
        setProperties((prev) => [...prev, ...results]);
      } else {
        setProperties(results);
      }

      setLastDoc(newLastDoc);
      setHasMore(hasMore);
      // console.log("Fetching");
      // const propertyRef = collection(db, "properties");
      // const constraints: QueryConstraint[] = [
      //   orderBy("createdAt", "desc"),
      //   limit(PAGE_SIZE),
      // ];

      // // Filters
      // if (queryParams.get("city")) {
      //   constraints.push(where("city", "==", queryParams.get("city")));
      // }
      // if (queryParams.get("address")) {
      //   const radius = parseFloat(queryParams.get("radius") || "15");
      //   try {
      //     const { latitude, longitude } = await geocodeAddress(
      //       queryParams.get("address")!
      //     );
      //     const { sw, ne } = getBoundingBoxFromRadius(
      //       latitude,
      //       longitude,
      //       radius
      //     );

      //     constraints.push(
      //       where("geolocation.latitude", "<=", ne.lat),
      //       where("geolocation.latitude", ">=", sw.lat),
      //       where("geolocation.longitude", "<=", ne.lng),
      //       where("geolocation.longitude", ">=", sw.lng)
      //     );
      //   } catch (err) {
      //     console.error("Error geocoding address:", err);
      //   }
      // } else {
      //   constraints.push(
      //     where("geolocation.latitude", "<=", 90),
      //     where("geolocation.latitude", ">=", -90),
      //     where("geolocation.longitude", "<=", 180),
      //     where("geolocation.longitude", ">=", -180)
      //   );
      // }
      // if (queryParams.get("type")) {
      //   constraints.push(where("type", "==", queryParams.get("type")));
      // }
      // if (queryParams.get("disposition")) {
      //   constraints.push(
      //     where("disposition", "==", queryParams.get("disposition"))
      //   );
      // }

      // // Price
      // constraints.push(
      //   where("price", ">=", parseInt(queryParams.get("minPrice") || "0"))
      // );
      // if (queryParams.get("maxPrice")) {
      //   constraints.push(
      //     where(
      //       "price",
      //       "<=",
      //       parseInt(queryParams.get("maxPrice") || "99999999")
      //     )
      //   );
      // }

      // // Chips
      // if (queryParams.get("garage") === "true") {
      //   constraints.push(where("garage", "==", true));
      // }
      // if (queryParams.get("elevator") === "true") {
      //   constraints.push(where("elevator", "==", true));
      // }
      // if (queryParams.get("gasConnection") === "true") {
      //   constraints.push(where("gasConnection", "==", true));
      // }
      // if (queryParams.get("threePhaseElectricity") === "true") {
      //   constraints.push(where("threePhaseElectricity", "==", true));
      // }
      // if (queryParams.get("basement") === "true") {
      //   constraints.push(where("basement", "==", true));
      // }
      // if (queryParams.get("furnished") === "true") {
      //   constraints.push(where("furnished", "==", true));
      // }
      // if (queryParams.get("balcony") === "true") {
      //   constraints.push(where("balcony", "==", true));
      // }
      // if (queryParams.get("garden") === "true") {
      //   constraints.push(where("garden", "==", true));
      // }
      // if (queryParams.get("solarPanels") === "true") {
      //   constraints.push(where("solarPanels", "==", true));
      // }
      // if (queryParams.get("pool") === "true") {
      //   constraints.push(where("pool", "==", true));
      // }

      // // Pagination
      // if (isPaginating && lastDoc) {
      //   constraints.push(startAfter(lastDoc));
      // }

      // const queryRef = query(propertyRef, ...constraints);
      // const snapshot = await getDocs(queryRef);

      // const results = snapshot.docs.map((doc) => ({
      //   id: doc.id,
      //   ...(doc.data() as Omit<PropertySearchResults, "id">),
      // }));

      // if (isPaginating) {
      //   setProperties((prev) => [...prev, ...results]);
      // } else {
      //   setProperties(results);
      // }

      // // Update cursor and hasMore
      // setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      // setHasMore(snapshot.size === PAGE_SIZE);
    } catch (error) {
      showToast(
        "Nastala chyba při načítání nemovitostí. Zkuste to prosím znovu.",
        2500
      );
      console.error("Failed to fetch properties:", error);
    } finally {
      console.log("Loading finished");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("UseEffect triggered");
    fetchResults(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const handleSaveToFavorites = (name: string) => {
    if (!name || !name.trim()) {
      hapticsHeavy();
      showToast("Název filtru je povinný!", 2500);
      return;
    }

    saveFavoriteFilter(user?.uid ?? "", name, queryParams.toString());

    showToast("Filtry byly úspěšně uloženy!", 1500);
  };

  return (
    <IonPage className="search-results-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          {properties.length != 0 && (
            <IonButtons slot="end" style={{ paddingRight: "15px" }}>
              <IonIcon
                icon={mapOutline}
                slot="icon-only"
                onClick={() => history.push("/searchmap", { properties })}
              />
            </IonButtons>
          )}
          <IonButtons slot="end" style={{ paddingRight: "15px" }}>
            <IonIcon
              icon={starOutline}
              slot="icon-only"
              id="favorite-alert"
              onClick={async () => await hapticsLight()}
            />
          </IonButtons>
          <IonTitle>Výsledky hledání</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding" scrollEvents>
        {loading ? (
          [...Array(5)].map((_, index) => (
            <IonCard key={`skeleton-${index}`} className="property-card-list">
              <IonSkeletonText
                animated
                style={{
                  width: "100%",
                  height: "200px",
                  borderRadius: "8px",
                  margin: "0px",
                }}
              />
              <IonCardHeader>
                <IonCardTitle>
                  <IonSkeletonText
                    animated
                    style={{ width: "80%", height: "16px" }}
                  />
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonSkeletonText
                  animated
                  style={{ width: "50%", height: "15px" }}
                />
              </IonCardContent>
            </IonCard>
          ))
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={searchOutline} size="large" color="medium" />
            <h2>Žádné nemovitosti nenalezeny</h2>
            <IonText color="medium">
              <p>
                Žádné nemovitosti neodpovídají vašemu vyhledávání. Zkuste
                upravit filtry nebo hledat znovu.
              </p>
            </IonText>
            <IonButton
              expand="block"
              onClick={() => history.push("/home")}
              className="ion-margin-top"
            >
              <IonIcon icon={homeOutline} slot="start" className="icon-align" />
              Zpět na domovskou stránku
            </IonButton>
          </div>
        ) : (
          <>
            {properties.map((property) => (
              <IonCard
                key={property.id}
                className="property-card-list"
                onClick={() => history.push(`/details/${property.id}`)}
              >
                <IonImg
                  src={property.imageUrl}
                  alt={property.title}
                  className="card-image"
                />
                <IonCardHeader>
                  <IonCardTitle>{property.title}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>{property.price.toLocaleString("cs")} Kč</strong>
                </IonCardContent>
              </IonCard>
            ))}

            <IonInfiniteScroll
              threshold="100px"
              disabled={!hasMore}
              onIonInfinite={async (event) => {
                await fetchResults(true);
                (event.target as HTMLIonInfiniteScrollElement).complete();
              }}
            >
              <IonInfiniteScrollContent loadingText="Načítám další..." />
            </IonInfiniteScroll>
          </>
        )}
        <IonAlert
          trigger="favorite-alert"
          header="Název oblíbeného filtru"
          buttons={[
            {
              text: "Zrušit",
              role: "cancel",
            },
            {
              text: "Uložit",
              role: "confirm",
              handler: (e) => {
                handleSaveToFavorites(e.filterName);
              },
            },
          ]}
          inputs={[
            {
              name: "filterName",
              placeholder: "Název filtru",
            },
          ]}
        ></IonAlert>
      </IonContent>
    </IonPage>
  );
};

export default SearchResults;
