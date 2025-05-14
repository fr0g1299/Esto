import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import "./MiniMap.css";
import { IonIcon } from "@ionic/react";
import { refresh } from "ionicons/icons";

const ResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
};

interface MiniMapProps {
  position: LatLngExpression;
  zoom?: number;
  height?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ position, zoom = 15 }) => {
  return (
    <div className="mini-map">
      <MapContainer
        center={position}
        zoom={zoom}
        dragging={true}
        doubleClickZoom={true}
        scrollWheelZoom={false}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <ResizeFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          icon={
            new L.Icon({
              iconUrl: markerIconPng,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }
        />
        {(() => {
          const ResetButton = () => {
            const map = useMap();
            return (
              <IonIcon
                onClick={() => map.setView(position, zoom)}
                icon={refresh}
                color="secondary"
                className="reset-button"
              />
            );
          };
          return <ResetButton />;
        })()}
      </MapContainer>
    </div>
  );
};

export default MiniMap;
