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
  IonList,
  IonItem,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  useIonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter,
} from "@ionic/react";
import { useParams } from "react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  GeoPoint,
  increment,
  updateDoc,
  setDoc,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useHistory } from "react-router";
import MiniMap from "../components/ui/MiniMap";

import {
  heartOutline,
  heart,
  callOutline,
  mailOutline,
  checkmarkOutline,
  notifications,
  notificationsOutline,
  shareOutline,
  locationOutline,
  homeOutline,
  calendarOutline,
  closeOutline,
  eyeOutline,
  createOutline,
  cloudDownloadOutline,
  refresh,
} from "ionicons/icons";

import { EffectFade, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperClass } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../styles/PropertyDetails.css";
import ImageViewerModal from "../components/ui/ImageViewerModal";
import FavoriteSelectorModal from "../components/ui/FavoriteSelectorModal";
import { isPropertyFavorited } from "../services/favoritesService";
import { useAuth } from "../hooks/useAuth";
import { useStorage } from "../hooks/useStorage";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import { getOrCreateChat } from "../services/chatService";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { hapticsLight } from "../services/haptics";
import { getNotificationProperties } from "../services/propertyService";

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

interface PropertyImages {
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

interface UserContact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

const slideOpts = {
  spaceBetween: 30,
  centeredSlides: true,
  effect: "fade",
  modules: [EffectFade, Autoplay],
  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
    loop: true,
  },
};

const incrementViews = async (id: string) => {
  try {
    const docRef = doc(db, "properties", id);
    await updateDoc(docRef, {
      views: increment(1),
    });
    console.log("Views incremented successfully");
  } catch (error) {
    console.error("Failed to increment views:", error);
  }
};

const PropertyDetails: React.FC = () => {
  const { propertyId } = useParams<RouteParams>();
  useTabBarScrollEffect();
  const [showToast] = useIonToast();
  const history = useHistory();
  const { user } = useAuth();
  const { get, set, ready } = useStorage();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  const [property, setProperty] = useState<Property>();
  const [details, setDetails] = useState<PropertyDetails>();
  const [images, setImages] = useState<PropertyImages[]>();
  const [userContact, setUserContact] = useState<UserContact>();
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);

  const swiperRef = useRef<SwiperClass | null>(null);
  const [features, setFeatures] = useState<
    { label: string; value: boolean | undefined }[]
  >([]);
  const [cardDetails, setCardDetails] = useState<
    { label: string; value: boolean | undefined }[]
  >([]);

  const fetchData = useCallback(
    async (refresh: boolean = false) => {
      if (!propertyId) return;
      //TODO: clean this up into a service
      const propertyDoc = await getDoc(doc(db, "properties", propertyId));
      if (!propertyDoc.exists()) {
        history.replace("/not-found");
      }
      const detailsDoc = await getDoc(
        doc(db, "properties", propertyId, "details", "data")
      );
      const imageDocs = await getDocs(
        collection(db, "properties", propertyId, "images")
      );
      const userDoc = await getDoc(
        doc(db, "users", propertyDoc.data()?.ownerId)
      );
      if (propertyDoc.exists()) {
        setProperty({ ...(propertyDoc.data() as Property), propertyId });

        setFeatures([
          { label: "Garáž", value: propertyDoc.data().garage },
          { label: "Výtah", value: propertyDoc.data().elevator },
          {
            label: "Plynové připojení",
            value: propertyDoc.data().gasConnection,
          },
          {
            label: "Třífázová elektřina",
            value: propertyDoc.data().threePhaseElectricity,
          },
          { label: "Sklep", value: propertyDoc.data().basement },
          { label: "Zařízený", value: propertyDoc.data().furnished },
          { label: "Balkón", value: propertyDoc.data().balcony },
          { label: "Zahrada", value: propertyDoc.data().garden },
          { label: "Solární panely", value: propertyDoc.data().solarPanels },
          { label: "Bazén", value: propertyDoc.data().pool },
        ]);
      }
      if (detailsDoc.exists()) {
        setDetails(detailsDoc.data() as PropertyDetails);

        setCardDetails([
          { label: "Počet pokojů", value: detailsDoc.data().rooms },
          { label: "Koupelny", value: detailsDoc.data().bathroomCount },
          { label: "Podlaží", value: detailsDoc.data().floors },
          { label: "Rok výstavby", value: detailsDoc.data().yearBuilt },
          { label: "Parkovací místa", value: detailsDoc.data().parkingSpots },
          { label: "Vytápění", value: detailsDoc.data().heatingType },
        ]);
      }
      if (userDoc.exists()) setUserContact(userDoc.data() as UserContact);
      setImages(
        imageDocs.docs
          .map((doc) => doc.data() as PropertyImages)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      if (!refresh) {
        await incrementViews(propertyId);
      }

      if (!user) return;

      const isFav = await isPropertyFavorited(user.uid, propertyId);
      setIsFavorite(isFav);
    },
    [propertyId, history, user]
  );

  useEffect(() => {
    const checkNotificationPref = async () => {
      if (!user) return;
      const prop = await getNotificationProperties(user.uid);

      const propertyIds = prop.map((p) => p.id);
      if (!propertyIds.includes(propertyId)) {
        setNotificationsEnabled(false);
        return;
      }
      setNotificationsEnabled(true);
    };

    const notificationsEnabled = async () => {
      if (!ready) return;
      const { value } = await Preferences.get({ key: "pushEnabled" });
      setPushEnabled(value === "true");
    };

    const checkIfSaved = async () => {
      if (!ready) return;
      const savedProperties = (await get("properties")) || [];
      const isSaved = savedProperties.some(
        (savedProperty: Property) => savedProperty.propertyId === propertyId
      );
      setIsSavedOffline(isSaved);
    };

    checkNotificationPref();
    notificationsEnabled();
    checkIfSaved();
  }, [propertyId, user, history, get, ready]);

  useIonViewWillEnter(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!property) return;
    const saveToViewedHistory = async () => {
      const { title, price, imageUrl } = property;
      const minimalProperty = { propertyId, title, price, imageUrl };

      const viewedHistory: (typeof minimalProperty)[] =
        (await get("viewedHistory")) || [];

      const updatedHistory = [
        minimalProperty,
        ...viewedHistory.filter(
          (p) => p.propertyId !== minimalProperty.propertyId
        ),
      ];

      if (updatedHistory.length > 10) {
        updatedHistory.pop();
      }

      console.log("Updated history:", updatedHistory);

      await set("viewedHistory", updatedHistory);
    };

    saveToViewedHistory();
  }, [propertyId, property, ready, set, get]);

  useEffect(() => {
    if (!viewerOpen) {
      swiperRef.current?.autoplay.start();
    }
    console.log("Viewer open state changed:", viewerOpen);
  }, [viewerOpen]);

  const handleClose = async () => {
    await hapticsLight();
    setShowFavoriteModal(false);
    const updated = await isPropertyFavorited(user?.uid ?? "", propertyId);
    setIsFavorite(updated);
  };

  const handleNotification = async () => {
    if (!user?.uid || !propertyId) return;
    if (!property) return;

    try {
      if (!notificationsEnabled) {
        const notificationPreference = {
          notifyOnPriceDrop: true,
          title: property.title,
          price: property.price,
          createdAt: new Date(),
        };

        await setDoc(
          doc(db, "users", user.uid, "notificationsPreferences", propertyId),
          notificationPreference
        );

        setNotificationsEnabled(!notificationsEnabled);
        showToast(
          "Nyní budete upozorněni na snížení ceny této nemovitosti.",
          2500
        );

        console.log("Notification preference saved successfully.");
      } else {
        await deleteDoc(
          doc(db, "users", user.uid, "notificationsPreferences", propertyId)
        );

        setNotificationsEnabled(!notificationsEnabled);
        showToast("Upozornění na snížení ceny bylo zrušeno.", 2500);
      }
    } catch (error) {
      console.error("Failed to save notification preference:", error);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    await Share.share({
      title: property.title,
      text: `${property.title}\n ${property.price.toLocaleString("cs")} Kč\n ${
        property.disposition
      }`,
      dialogTitle: "Sdílet inzerát",
    });
  };

  const handleSavePropertyOffline = async () => {
    if (!property || !details) return;
    await hapticsLight();

    const propertyToSave = { ...property };

    // Save data to storage
    const existing = (await get("properties")) || [];
    await set("properties", [...existing, propertyToSave]);

    const detailsMap = (await get("detailsMap")) || {};
    await set("detailsMap", {
      ...detailsMap,
      [property.propertyId]: { ...details, propertyId },
    });

    showToast("Nemovitost byla uložena offline", 2500);
    setIsSavedOffline(true);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    fetchData(true);
    event.detail.complete();
  };

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
          <IonButtons slot="start" style={{ paddingLeft: "5px" }}>
            <IonIcon
              icon={shareOutline}
              color="secondary"
              slot="icon-only"
              className="toolbar-icon"
              onClick={handleShare}
            />
          </IonButtons>
          {!isSavedOffline && (
            <IonButtons slot="end" style={{ paddingRight: "15px" }}>
              <IonIcon
                icon={cloudDownloadOutline}
                color="secondary"
                slot="icon-only"
                className="toolbar-icon"
                onClick={handleSavePropertyOffline}
              />
            </IonButtons>
          )}
          {user?.uid === property.ownerId ? (
            <IonButtons slot="end" style={{ paddingRight: "15px" }}>
              <IonIcon
                icon={createOutline}
                color="secondary"
                slot="icon-only"
                className="toolbar-icon"
                onClick={() => history.push(`/edit/${propertyId}`)}
              />
            </IonButtons>
          ) : pushEnabled ? (
            <IonButtons slot="end" style={{ paddingRight: "15px" }}>
              <IonIcon
                icon={
                  notificationsEnabled ? notifications : notificationsOutline
                }
                color="secondary"
                slot="icon-only"
                className="toolbar-icon"
                onClick={handleNotification}
              />
            </IonButtons>
          ) : null}
          {user && (
            <IonButtons slot="end" style={{ paddingRight: "15px" }}>
              <IonIcon
                icon={isFavorite ? heart : heartOutline}
                slot="icon-only"
                color="danger"
                className="toolbar-icon"
                onClick={async () => {
                  await hapticsLight();
                  setShowFavoriteModal(true);
                }}
              />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollEvents>
        <IonRefresher
          slot="fixed"
          onIonRefresh={handleRefresh}
          pullMin={100}
          pullMax={200}
        >
          <IonRefresherContent
            pullingIcon={refresh}
            pullingText="Stáhněte pro obnovení"
            refreshingSpinner="crescent"
            refreshingText="Obnovuji..."
          />
        </IonRefresher>
        <div className="swiper-container">
          <Swiper
            {...slideOpts}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
          >
            {images?.map((img, idx) => (
              <SwiperSlide
                key={idx}
                onClick={() => {
                  setViewerOpen(true);
                  swiperRef.current?.autoplay.stop();
                }}
              >
                <img
                  src={img.imageUrl}
                  alt={img.altText}
                  className="swiper-image"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <ImageViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          images={images || []}
        />
        <FavoriteSelectorModal
          isOpen={showFavoriteModal}
          onClose={handleClose}
          propertyId={propertyId}
          title={property.title}
          price={property.price}
          disposition={property.disposition}
          imageUrl={property.imageUrl}
        />
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
              {details.kitchenEquipment.length > 0 && (
                <div className="kitchen-equipment">
                  <h3 className="section-subtitle">Kuchyňské vybavení:</h3>
                  <ul className="list-disc bolder-content">
                    {details.kitchenEquipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                  {new Date(property.createdAt?.toDate?.()).toLocaleString(
                    "cs"
                  )}
                </span>
              </div>
              <div className="flex-align-center bolder-content">
                <IonIcon icon={calendarOutline} className="icon" />
                <span>
                  Aktualizováno:{" "}
                  {new Date(property.updatedAt?.toDate?.()).toLocaleString(
                    "cs"
                  )}
                </span>
              </div>
              <div className="flex-align-center bolder-content">
                <IonIcon icon={eyeOutline} className="icon" />
                <span>Zobrazení: {property.views?.toLocaleString("cs")}</span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Contact */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">Kontakt</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList className="ion-no-padding">
                <IonItem lines="inset" style={{ fontWeight: "500" }}>
                  {userContact?.firstName} {userContact?.lastName}
                </IonItem>
                <IonItem lines="inset">
                  <IonIcon icon={callOutline} slot="start" color="primary" />
                  <IonText>{userContact?.phone}</IonText>
                </IonItem>
                <IonItem
                  button
                  lines="none"
                  onClick={() =>
                    (window.location.href = `mailto:${userContact?.email}`)
                  }
                >
                  <IonIcon icon={mailOutline} slot="start" color="primary" />
                  <IonText>{userContact?.email}</IonText>
                </IonItem>
              </IonList>
              {user && user?.uid !== property.ownerId && (
                <a
                  className="contact-button"
                  onClick={async () => {
                    const chatId = await getOrCreateChat(
                      user?.uid ?? "",
                      property.ownerId,
                      propertyId,
                      property.title,
                      property.imageUrl
                    );
                    history.push({
                      pathname: `/chat/${chatId}`,
                      state: { userContact, propertyId: propertyId },
                    });
                  }}
                >
                  Kontaktovat majitele <br />
                  prostřednictvím real-time chatu
                </a>
              )}
            </IonCardContent>
          </IonCard>

          {/* Location Details */}
          <IonCard className="property-card">
            <IonCardHeader>
              <IonCardTitle className="section-title">Lokalita</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex-align-center">
                <IonIcon icon={locationOutline} className="icon" />
                <div className="address-block">
                  <span className="bolder-content">
                    <strong>{property.address}</strong>
                  </span>
                  <p>
                    {property.city}, {details.postalCode}
                  </p>
                </div>
              </div>

              <MiniMap
                position={[
                  property.geolocation.latitude,
                  property.geolocation.longitude,
                ]}
              />
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PropertyDetails;
