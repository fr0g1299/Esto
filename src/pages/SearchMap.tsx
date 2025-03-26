import React from "react";
import { IonPage, IonContent } from "@ionic/react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/SearchMap.css";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, GeoPoint, getDocs } from "firebase/firestore";

// Fix for missing marker icons in Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Property {
  id: string;
  title: string;
  geolocation: GeoPoint;
  imageUrl: string;
}

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
      <IonContent fullscreen>
        <MapContainer
          center={[49.8175, 15.473]}
          zoom={7}
          scrollWheelZoom={true}
          className="map-container"
        >
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
