import React, { useEffect, useState } from "react";
import { IonPage, IonContent } from "@ionic/react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { collection, GeoPoint, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import MarkerClusterGroup from "react-leaflet-markercluster";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import "../styles/SearchMap.css";

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
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
};

const SearchMap: React.FC = () => {
  const location = useLocation<LocationState>();
  const [properties, setProperties] = useState<Property[]>([]);

  const fetchAllProperties = async () => {
    const propRef = collection(db, "properties");
    const propSnap = await getDocs(propRef);
    const props: Property[] = [];
    propSnap.forEach((doc) => {
      const data = doc.data();
      props.push({
        id: doc.id,
        title: data.title,
        geolocation: data.geolocation,
        imageUrl: data.imageUrl,
      });
    });
    setProperties(props);
  };

  useEffect(() => {
    if (
      location.state &&
      location.state.properties &&
      location.state.properties.length > 0
    ) {
      // If properties passed in state (from search result page)
      setProperties(location.state.properties);
    } else {
      // Otherwise, fetch all properties from Firestore
      fetchAllProperties();
    }
  }, [location.state]);

  return (
    <IonPage className="search-map-page">
      <IonContent fullscreen className="no-scrollbar">
        <MapContainer
          center={[50.0755, 14.4378]}
          zoom={10}
          scrollWheelZoom={true}
          className="map-container"
        >
          <ResizeMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup
            key={properties.map((p) => p.id).join(",")}
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
