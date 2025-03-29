import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/SearchMap.css";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, GeoPoint, getDocs } from "firebase/firestore";

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
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const propertiesSnapshot = await getDocs(collection(db, "properties"));
      const data: Property[] = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Property, "id">),
      }));
      console.log(data);
      setProperties(data);
    };

    fetchProperties();
  }, []);

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
      <IonContent fullscreen>
        <MapContainer
          center={[49.8175, 15.473]}
          zoom={7}
          scrollWheelZoom={true}
          className="map-container"
        >
          <ResizeMap />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
