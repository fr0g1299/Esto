import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonSpinner,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  startAfter,
  limit,
  orderBy,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

interface Property {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  balcony: boolean;
  garden: boolean;
  city?: string;
  views: number;
}

const useQueryParams = () => {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const SearchResults: React.FC = () => {
  const history = useHistory();
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const queryParams = useQueryParams();

  const PAGE_SIZE = 5;

  const fetchResults = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
    }

    try {
      console.log("Fetching");
      const propertyRef = collection(db, "properties");
      const constraints: QueryConstraint[] = [
        where("views", ">=", 0),
        orderBy("views", "asc"),
        limit(PAGE_SIZE),
      ];

      // Filters
      if (queryParams.get("balcony") === "true") {
        constraints.push(where("balcony", "==", true));
      }

      if (queryParams.get("garden") === "true") {
        constraints.push(where("garden", "==", true));
      }

      if (queryParams.get("city")) {
        constraints.push(where("city", "==", queryParams.get("city")));
      }

      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      console.log("Constraints:", constraints);
      const q = query(propertyRef, ...constraints);
      console.log("Query created:", q);
      const snapshot = await getDocs(q);

      const newData: Property[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Property, "id">),
      }));

      console.log("Fetched data:", newData);
      const maxPrice = queryParams.get("maxPrice");
      const minPrice = queryParams.get("minPrice");
      const filtered = newData.filter((item) => {
        const isBelowMaxPrice = maxPrice
          ? item.price <= parseInt(maxPrice)
          : true;
        const isAboveMinPrice = minPrice
          ? item.price >= parseInt(minPrice)
          : true;
        return isBelowMaxPrice && isAboveMinPrice;
      });

      const sorted = filtered.sort((a, b) => a.views - b.views);

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(newLastDoc);

      setResults((prev) => (isLoadMore ? [...prev, ...sorted] : sorted));
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      console.log("Loading finished");
      setLoading(false);
    }
  };
  useEffect(() => {
    console.log("UseEffect triggered");
    fetchResults(false);
    // TODO: eslint warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Results</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading && !results.length ? (
          <IonSpinner name="crescent" />
        ) : results.length === 0 ? (
          <IonText>No matching properties found.</IonText>
        ) : (
          <>
            {results.map((property) => (
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
                  <strong>{property.price.toLocaleString()} $</strong>
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
              <IonInfiniteScrollContent loadingText="Loading more..." />
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SearchResults;
