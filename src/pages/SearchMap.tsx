import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { LocationStateMap, PropertyMarker } from "../types/interfaces";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { refresh } from "ionicons/icons";
import "../styles/SearchMap.css";
import { fetchAllProperties } from "../services/propertyService";

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
  const location = useLocation<LocationStateMap>();
  const [properties, setProperties] = useState<PropertyMarker[]>([]);

  const fetchProperties = async () => {
    const props = await fetchAllProperties();
    setProperties(props);
  };

  useEffect(() => {
    if (
      location.state &&
      location.state.properties &&
      location.state.properties.length > 0
    ) {
      // If properties passed in state (from search result page)
      setProperties(
        location.state.properties.map((property) => ({
          id: property.propertyId ?? "",
          title: property.title,
          geolocation: property.geolocation,
          imageUrl: property.imageUrl,
        }))
      );
    } else {
      // Otherwise, fetch all properties from Firestore
      fetchProperties();
    }
  }, [location.state]);

  return (
    <IonPage className="search-map-page">
      <IonContent fullscreen className="no-scrollbar">
        <IonIcon
          icon={refresh}
          onClick={() => {
            const map = document.querySelector(".map-container");
            if (map) {
              window.dispatchEvent(new Event("resize"));
            }
          }}
          className="refresh-icon"
        />

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
