import React from "react";
import { IonPage, IonContent, useIonViewWillEnter } from "@ionic/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/SearchMap.css";
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, GeoPoint, getDocs } from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { useStorage } from "../hooks/useStorage";
import MarkerClusterGroup from "react-leaflet-markercluster";
import markerIconPng from "leaflet/dist/images/marker-icon.png";

interface Property {
  id: string;
  title: string;
  geolocation: GeoPoint;
  imageUrl: string;
}

const ResizeMap = () => {
  const map = useMap();
  map.invalidateSize();
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const { get, ready } = useStorage();

  const [mapBounds, setMapBounds] = useState<{
    sw: L.LatLng;
    ne: L.LatLng;
  } | null>(null);
  const lastFetchedBounds = useRef<{ sw: L.LatLng; ne: L.LatLng } | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapBounds) return;

    // Clear previous debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const { sw, ne } = mapBounds;
      const last = lastFetchedBounds.current;

      // Check if bounds changed significantly
      const boundsChanged =
        !last ||
        Math.abs(last.sw.lat - sw.lat) > 0.01 ||
        Math.abs(last.sw.lng - sw.lng) > 0.01 ||
        Math.abs(last.ne.lat - ne.lat) > 0.01 ||
        Math.abs(last.ne.lng - ne.lng) > 0.01;

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
        const data: Property[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Property, "id">),
        }));

        const sameIds =
          data.map((p) => p.id).join(",") ===
          properties.map((p) => p.id).join(",");
        if (sameIds) return;
        if (!sameIds) {
          console.log("Properties changed, updating state...");
          setProperties(data);
        }
      };

      fetchVisibleProperties();
    }, 900);
  }, [mapBounds, properties]);

  useIonViewWillEnter(() => {
    const getDarkTheme = async () => {
      console.log("useIonViewDidEnter...");
      if (!ready) return;
      const dark = await get("darkTheme");
      console.log("Stored darkTheme value:", dark);
      setIsDarkMode(dark);
    };

    getDarkTheme();
  }, [ready, get]);

  const darkTiles =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const lightTiles = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <IonPage>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      />
      <script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      ></script>
      <IonContent fullscreen className="no-scrollbar">
        <MapContainer
          center={[49.8175, 15.473]}
          zoom={7}
          scrollWheelZoom={true}
          className="map-container"
        >
          {/* {properties.length === 0 && ( // TODO: markers blink on load */}
          <MapBoundsInitializer onBoundsChange={setMapBounds} />
          {/* )} */}
          <ResizeMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url={isDarkMode ? darkTiles : lightTiles}
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
                <Popup>
                  <strong>{property.title}</strong>
                  <br />
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="property-image"
                  />
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
