import React from "react";
import { IonPage, IonContent, useIonViewDidLeave } from "@ionic/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/SearchMap.css";
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, GeoPoint, getDocs } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import MarkerClusterGroup from "react-leaflet-markercluster";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { Link, useLocation } from "react-router-dom";

interface Property {
  id: string;
  title: string;
  geolocation: GeoPoint;
  imageUrl: string;
}

interface LocationState {
  properties: Property[];
}

const ResizeMap = () => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
};

const MapBoundsInitializer: React.FC<{
  onBoundsChange: (bounds: { sw: L.LatLng; ne: L.LatLng }) => void;
}> = ({ onBoundsChange }) => {
  const map = useMap();

  useEffect(() => {
    const updateBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast(),
      });
    };

    map.on("moveend", updateBounds);
    updateBounds();

    return () => {
      map.off("moveend", updateBounds);
    };
  }, [map, onBoundsChange]);

  return null;
};

const SearchMap: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const location = useLocation<LocationState>();
  const [propertiesFromState, setPropertiesFromState] = useState<Property[]>(
    []
  );

  console.log(location);
  const [mapBounds, setMapBounds] = useState<{
    sw: L.LatLng;
    ne: L.LatLng;
  } | null>(null);
  const lastFetchedBounds = useRef<{ sw: L.LatLng; ne: L.LatLng } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const propertyCache = useRef<Map<string, Property>>(new Map());

  useIonViewDidLeave(() => {
    if (propertiesFromState.length > 0) {
      setPropertiesFromState([]);
      setProperties([]);
    }
  });
  useEffect(() => {
    setPropertiesFromState(location.state?.properties || []);
  }, [location]);

  useEffect(() => {
    // If propertiesFromState is not empty, skip the debounce logic
    if (propertiesFromState.length > 0) {
      console.log("Using properties from state, skipping debounce logic.");
      setProperties(propertiesFromState); // Set properties from state
      return;
    }

    if (!mapBounds) return;

    // Clear previous debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const { sw, ne } = mapBounds;
      const last = lastFetchedBounds.current;

      // Check if bounds changed significantly
      const boundsChanged =
        !last ||
        Math.abs(last.sw.lat - sw.lat) > 0.15 ||
        Math.abs(last.sw.lng - sw.lng) > 0.15 ||
        Math.abs(last.ne.lat - ne.lat) > 0.15 ||
        Math.abs(last.ne.lng - ne.lng) > 0.15;

      if (!boundsChanged) {
        console.log("Bounds didn't change significantly — skip fetch.");
        return;
      }

      lastFetchedBounds.current = mapBounds;

      const fetchVisibleProperties = async () => {
        console.log("Fetching properties in bounds:", sw, ne);

        const propertiesQuery = query(
          collection(db, "properties"),
          where("geolocation.latitude", ">=", sw.lat),
          where("geolocation.latitude", "<=", ne.lat),
          where("geolocation.longitude", ">=", sw.lng),
          where("geolocation.longitude", "<=", ne.lng)
        );

        const snapshot = await getDocs(propertiesQuery);

        const newProperties: Property[] = [];
        const fetchedIds: Set<string> = new Set();

        snapshot.forEach((doc) => {
          fetchedIds.add(doc.id);
          if (!propertyCache.current.has(doc.id)) {
            const data = doc.data() as Omit<Property, "id">;
            const property: Property = { id: doc.id, ...data };
            propertyCache.current.set(doc.id, property);
            newProperties.push(property);
          }
        });

        if (newProperties.length > 0) {
          console.log("New properties found:", newProperties.length);
          setProperties((prev) => [...prev, ...newProperties]);
        } else {
          console.log("No new properties found.");
        }
      };

      fetchVisibleProperties();
    }, 900);
  }, [mapBounds, properties, propertiesFromState]);

  return (
    <IonPage className="search-map-page">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <IonContent fullscreen className="no-scrollbar">
        <MapContainer
          center={[50.0755, 14.4378]}
          zoom={10}
          scrollWheelZoom={true}
          className="map-container"
        >
          {/* TODO: markers blink on load */}
          {propertiesFromState.length === 0 && (
            <MapBoundsInitializer onBoundsChange={setMapBounds} />
          )}
          <ResizeMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy;'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          <MarkerClusterGroup
            spiderfyDistanceMultiplier={1}
            showCoverageOnHover={true}
          >
            {properties.map((property) => (
              <Marker
                key={property.id}
                position={[
                  property.geolocation.latitude,
                  property.geolocation.longitude,
                ]}
                icon={
                  new Icon({
                    iconUrl: markerIconPng,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })
                }
              >
                <Popup className="popup">
                  <Link to={`/details/${property.id}`} className="popup-link">
                    <strong className="popup-title">{property.title}</strong>
                    <br />
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="popup-image"
                    />
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </IonContent>
    </IonPage>
  );
};

export default SearchMap;
