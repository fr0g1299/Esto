import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonText,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
} from "@ionic/react";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { GeoPoint, Timestamp } from "firebase/firestore";

import {
  checkmarkOutline,
  homeOutline,
  calendarOutline,
  closeOutline,
  eyeOutline,
} from "ionicons/icons";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../styles/PropertyDetails.css";

import { useStorage } from "../hooks/useStorage";

import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";

interface RouteParams {
  propertyId: string;
}

interface Property {
  propertyId: string;
  ownerId: string;
  title: string;
  price: number;
  status: "Available" | "Sold";
  address: string;
  city: string;
  type: "Byt" | "Apartmán" | "Dům" | "Vila" | "Chata" | "Chalupa";
  disposition: string;
  imageUrl: string;
  geolocation: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  garage: boolean;
  elevator: boolean;
  gasConnection: boolean;
  threePhaseElectricity: boolean;
  basement: boolean;
  furnished: boolean;
  balcony: boolean;
  garden: boolean;
  solarPanels: boolean;
  pool: boolean;
  views: number;
}

interface PropertyDetails {
  yearBuilt: number;
  floors: number;
  bathroomCount: number;
  gardenSize: number;
  propertySize: number;
  parkingSpots: number;
  rooms: number;
  postalCode: string;
  description: string;
  kitchenEquipment: string[];
  heatingType: string;
}

const OfflineDetails: React.FC = () => {
  const { propertyId } = useParams<RouteParams>();
  useTabBarScrollEffect();
  const { get } = useStorage();

  const [property, setProperty] = useState<Property>();
  const [details, setDetails] = useState<PropertyDetails>();

  const [features, setFeatures] = useState<
    { label: string; value: boolean | undefined }[]
  >([]);
  const [cardDetails, setCardDetails] = useState<
    { label: string; value: boolean | undefined }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const storedProperties: Property[] = (await get("properties")) || [];
      const storedDetailsMap = (await get("detailsMap")) || {};

      const offlineProperty = await storedProperties.find(
        (p) => p.propertyId === propertyId
      );

      const offlineDetails = offlineProperty?.propertyId
        ? storedDetailsMap[offlineProperty.propertyId]
        : undefined;

      if (offlineProperty && offlineDetails) {
        setProperty(offlineProperty);
        setDetails(offlineDetails);

        setFeatures([
          { label: "Garáž", value: offlineProperty.garage },
          { label: "Výtah", value: offlineProperty.elevator },
          {
            label: "Plynové připojení",
            value: offlineProperty.gasConnection,
          },
          {
            label: "Třífázová elektřina",
            value: offlineProperty.threePhaseElectricity,
          },
          { label: "Sklep", value: offlineProperty.basement },
          { label: "Zařízený", value: offlineProperty.furnished },
          { label: "Balkón", value: offlineProperty.balcony },
          { label: "Zahrada", value: offlineProperty.garden },
          { label: "Solární panely", value: offlineProperty.solarPanels },
          { label: "Bazén", value: offlineProperty.pool },
        ]);
        setCardDetails([
          { label: "Počet pokojů", value: offlineDetails.rooms },
          { label: "Koupelny", value: offlineDetails.bathroomCount },
          { label: "Podlaží", value: offlineDetails.floors },
          { label: "Rok výstavby", value: offlineDetails.yearBuilt },
          { label: "Parkovací místa", value: offlineDetails.parkingSpots },
          { label: "Vytápění", value: offlineDetails.heatingType },
        ]);
      }
    };

    fetchData();
  }, [propertyId, get]);

  if (!property || !details)
    return (
      <IonPage className="property-details-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home"></IonBackButton>
            </IonButtons>
            <IonButtons slot="end"></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="swiper-container">
            <IonSkeletonText
              animated
              style={{
                width: "100%",
                height: "275px",
                margin: "0px",
              }}
            />
          </div>
          <div className="property-body">
            <IonCard className="property-card title-card">
              <IonCardHeader>
                <IonCardTitle className="property-title">
                  <IonSkeletonText
                    animated
                    style={{
                      width: "100%",
                      height: "20px",
                      borderRadius: "3px",
                    }}
                  />
                  <IonSkeletonText
                    animated
                    style={{
                      width: "70%",
                      height: "20px",
                      borderRadius: "3px",
                    }}
                  />
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent className="property-status">
                <IonChip color={"success"}>
                  <IonLabel>
                    <IonSkeletonText
                      animated
                      style={{
                        width: "50px",
                        height: "17px",
                        borderRadius: "3px",
                      }}
                    />
                  </IonLabel>
                </IonChip>
                <IonText className="property-price">
                  <IonSkeletonText
                    animated
                    style={{
                      width: "70px",
                      height: "17px",
                      borderRadius: "3px",
                    }}
                  />
                </IonText>
              </IonCardContent>
            </IonCard>

            <IonCard className="property-card">
              <IonCardHeader>
                <IonCardTitle className="section-title">
                  Přehled nemovitosti
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow className="bolder-content">
                    <IonCol size="6" style={{ display: "flex" }}>
                      <IonSkeletonText
                        animated
                        style={{
                          width: "50%",
                          height: "17px",
                          borderRadius: "3px",
                        }}
                      />
                    </IonCol>
                    <IonCol size="6">
                      <IonSkeletonText
                        animated
                        style={{
                          width: "50%",
                          height: "17px",
                          borderRadius: "3px",
                        }}
                      />
                    </IonCol>
                    <IonCol size="6">
                      <IonSkeletonText
                        animated
                        style={{
                          width: "50%",
                          height: "17px",
                          borderRadius: "3px",
                        }}
                      />
                    </IonCol>
                    <IonCol size="6">
                      <IonSkeletonText
                        animated
                        style={{
                          width: "50%",
                          height: "17px",
                          borderRadius: "3px",
                        }}
                      />
                    </IonCol>
                    {[...Array(6)].map((_, index) => (
                      <IonCol
                        key={index}
                        size="6"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <IonSkeletonText
                          animated
                          style={{
                            width: "50%",
                            height: "17px",
                            borderRadius: "3px",
                          }}
                        />
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            <IonCard className="property-card">
              <IonCardHeader>
                <IonCardTitle className="section-title">Vybavení</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    {[...Array(10)].map((_, index) => (
                      <IonCol
                        size="6"
                        key={index}
                        className="bolder-content"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <IonIcon
                          icon={checkmarkOutline}
                          color="primary"
                          className="boolean-icon"
                        />
                        <IonSkeletonText
                          animated
                          style={{
                            width: "50%",
                            height: "17px",
                            borderRadius: "3px",
                          }}
                        />
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            <IonCard className="property-card">
              <IonCardHeader>
                <IonCardTitle className="section-title">Popis</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonSkeletonText
                  animated
                  style={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "3px",
                  }}
                />
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );

  return (
    <IonPage className="property-details-page">
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              color="secondary"
              defaultHref="/home"
            ></IonBackButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollEvents>
        <div className="property-body">
          {/* Price and Status */}
          <IonCard className="property-card title-card">
            <IonCardHeader>
              <IonCardTitle className="property-title">
                {property.title}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="property-status">
              <IonChip
                color={property.status === "Available" ? "success" : "danger"}
              >
                <IonLabel>
                  {property.status === "Available" ? "Dostupné" : "Nedostupné"}
                </IonLabel>
              </IonChip>
              <IonText className="property-price">
                {property.price.toLocaleString("cs")} Kč
              </IonText>
            </IonCardContent>
          </IonCard>

          <IonCard className="property-card">
            <IonCardContent color="danger">Zobrazeno offline</IonCardContent>
          </IonCard>

          {/* Property Overview */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">
                Přehled nemovitosti
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow className="bolder-content">
                  <IonCol size="6" style={{ display: "flex" }}>
                    <strong>Typ:</strong>&nbsp;{property.type}&nbsp;
                    <IonIcon icon={homeOutline} className="icon" />
                  </IonCol>
                  <IonCol size="6">
                    <strong>Dispozice:</strong> {property.disposition}
                  </IonCol>
                  <IonCol size="6">
                    <strong>Velikost:</strong> {details.propertySize} m²
                  </IonCol>
                  <IonCol size="6">
                    <strong>Zahrada:</strong> {details.gardenSize} m²
                  </IonCol>
                  {cardDetails.map((item, index) => (
                    <IonCol
                      key={index}
                      size="6"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <strong>{item.label}:</strong>&nbsp;{item.value}
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Features */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">Vybavení</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  {features.map((feature, index) => (
                    <IonCol size="6" key={index} className="bolder-content">
                      <IonIcon
                        icon={feature.value ? checkmarkOutline : closeOutline}
                        color={feature.value ? "primary" : ""}
                        className="boolean-icon"
                      />
                      {feature.label}
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
              <div className="kitchen-equipment">
                <h3 className="section-subtitle">Kuchyňské vybavení:</h3>
                <ul className="list-disc bolder-content">
                  {details.kitchenEquipment.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Description */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">Popis</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText
                style={{
                  whiteSpace: "pre-line",
                  color: "var(--ion-text-color-step-100)",
                }}
              >
                {details.description}
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Dates */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">
                Další informace
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex-align-center bolder-content">
                <IonIcon icon={calendarOutline} className="icon" />
                <span>
                  Vytvořeno:{" "}
                  {property.createdAt?.toDate
                    ? new Date(property.createdAt.toDate()).toLocaleString("cs")
                    : "Datum není k dispozici"}
                </span>
              </div>
              <div className="flex-align-center bolder-content">
                <IonIcon icon={calendarOutline} className="icon" />
                <span>
                  Aktualizováno:{" "}
                  {property.updatedAt?.toDate
                    ? new Date(property.updatedAt.toDate()).toLocaleString("cs")
                    : "Datum není k dispozici"}
                </span>
              </div>
              <div className="flex-align-center bolder-content">
                <IonIcon icon={eyeOutline} className="icon" />
                <span>Zobrazení: {property.views?.toLocaleString("cs")}</span>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OfflineDetails;
