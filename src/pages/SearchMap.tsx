import React from "react";
import { IonPage, IonContent, useIonViewWillEnter } from "@ionic/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/SearchMap.css";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, GeoPoint, getDocs } from "firebase/firestore";
import { useStorage } from "../hooks/useStorage";

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

const SearchMap: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const { get, ready } = useStorage();

  useEffect(() => {
    const fetchThemeAndProperties = async () => {
      const propertiesSnapshot = await getDocs(collection(db, "properties"));
      const data: Property[] = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Property, "id">),
      }));
      console.log(data);
      setProperties(data);
    };

    fetchThemeAndProperties();
  }, []);

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
  const lightTiles =
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

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
          <ResizeMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url={isDarkMode ? darkTiles : lightTiles}
            className="map-tiles"
          />

          {properties.map((property) => (
            <Marker
              key={property.id}
              position={[
                property.geolocation.latitude,
                property.geolocation.longitude,
              ]}
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
        </MapContainer>
      </IonContent>
    </IonPage>
  );
};

export default SearchMap;
