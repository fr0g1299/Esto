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
  IonPopover,
  IonText,
  IonList,
  IonItem,
} from "@ionic/react";
import { useParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  GeoPoint,
  increment,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useHistory } from "react-router";

import {
  heartOutline,
  heart,
  callOutline,
  mailOutline,
  personOutline,
  chatboxEllipsesOutline,
  checkmarkOutline,
  pencil,
  notifications,
  notificationsOutline,
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

interface RouteParams {
  id: string;
}

interface Property {
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
  createdAt: Date;
  updatedAt: Date;
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
  videoUrl: string;
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
  } catch (error) {
    console.error("Failed to increment views:", error);
  }
};

const PropertyDetails: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const { user } = useAuth();
  const { get, set, ready } = useStorage();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [property, setProperty] = useState<Property>();
  const [details, setDetails] = useState<PropertyDetails>();
  const [images, setImages] = useState<PropertyImages[]>();
  const [userContact, setUserContact] = useState<UserContact>();
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);

  const swiperRef = useRef<SwiperClass | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      //TODO: clean this up into a service
      const propertyDoc = await getDoc(doc(db, "properties", id));
      if (!propertyDoc.exists()) {
        history.replace("/not-found");
      }
      const detailsDoc = await getDoc(
        doc(db, "properties", id, "details", "data")
      );
      const imageDocs = await getDocs(
        collection(db, "properties", id, "images")
      );
      const userDoc = await getDoc(
        doc(db, "users", propertyDoc.data()?.ownerId)
      );
      const isFav = await isPropertyFavorited(user?.uid ?? "", id);
      setIsFavorite(isFav);
      console.log(user?.uid);

      if (propertyDoc.exists()) setProperty(propertyDoc.data() as Property);
      if (detailsDoc.exists()) setDetails(detailsDoc.data() as PropertyDetails);
      if (userDoc.exists()) setUserContact(userDoc.data() as UserContact);
      setImages(imageDocs.docs.map((doc) => doc.data() as PropertyImages));
      incrementViews(id);
    };

    const checkNotificationPref = async () => {
      if (!user) return;
      const prefDoc = await getDoc(
        doc(db, "users", user.uid, "notificationsPreferences", id)
      );

      if (prefDoc.exists() && prefDoc.data().notifyOnPriceDrop) {
        setNotificationsEnabled(true);
      }
    };

    const notificationsEnabled = async () => {
      const { value } = await Preferences.get({ key: "pushEnabled" });
      setPushEnabled(value === "true");
    };

    console.log("Fetching data for property ID:", id);
    console.log("Property ID:", id);

    fetchData();
    notificationsEnabled();
    checkNotificationPref();
  }, [id, user, history]);

  useEffect(() => {
    if (!property) return;
    const saveToViewedHistory = async () => {
      const { title, price, imageUrl } = property;
      const minimalProperty = { id, title, price, imageUrl };
      console.log("id:", id);

      const viewedHistory: (typeof minimalProperty)[] =
        (await get("viewedHistory")) || [];

      const updatedHistory = [
        minimalProperty,
        ...viewedHistory.filter((p) => p.id !== minimalProperty.id),
      ];

      if (updatedHistory.length > 10) {
        updatedHistory.pop();
      }

      console.log("Updated history:", updatedHistory);

      await set("viewedHistory", updatedHistory);
    };

    saveToViewedHistory();
  }, [id, property, ready, set, get]);

  useEffect(() => {
    if (!viewerOpen) {
      swiperRef.current?.autoplay.start();
    }
    console.log("Viewer open state changed:", viewerOpen);
  }, [viewerOpen]);

  const handleClose = async () => {
    setShowFavoriteModal(false);
    const updated = await isPropertyFavorited(user?.uid ?? "", id);
    setIsFavorite(updated);
  };

  // const handleNotification = async () {

  // }

  const handleNotification = async () => {
    if (!user?.uid || !id) return;

    try {
      const notificationPreference = {
        notifyOnPriceDrop: true,
        createdAt: new Date(),
      };

      await setDoc(
        doc(db, "users", user.uid, "notificationsPreferences", id),
        notificationPreference
      );

      setNotificationsEnabled(!notificationsEnabled);

      console.log("Notification preference saved successfully.");
    } catch (error) {
      console.error("Failed to save notification preference:", error);
    }
  };

  if (!property || !details)
    return <IonContent fullscreen>Loading...</IonContent>;

  return (
    <IonPage className="property-details-page">
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home"></IonBackButton>
          </IonButtons>
          {user?.uid === property.ownerId ? (
            <IonButtons slot="end">
              <IonIcon
                icon={pencil}
                slot="icon-only"
                className="toolbar-icon"
                onClick={() => history.push(`/edit/${id}`)}
              />
            </IonButtons>
          ) : pushEnabled ? (
            <IonButtons slot="end">
              <IonIcon
                icon={
                  notificationsEnabled ? notifications : notificationsOutline
                }
                slot="icon-only"
                className="toolbar-icon"
                onClick={handleNotification}
              />
            </IonButtons>
          ) : null}
          <IonButtons slot="end">
            <IonIcon
              icon={isFavorite ? heart : heartOutline}
              slot="icon-only"
              color="danger"
              className="toolbar-icon"
              onClick={() => setShowFavoriteModal(true)}
            />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className=" property-details-content">
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
          propertyId={id}
          title={property.title}
          price={property.price}
          disposition={property.disposition}
          imageUrl={property.imageUrl}
        />
        <div className="property-body">
          {/* Main Info */}
          <h1>{property.title}</h1>
          <IonIcon
            icon={personOutline}
            id="click-trigger"
            size={"large"}
          ></IonIcon>
          <IonIcon
            icon={chatboxEllipsesOutline}
            size={"large"}
            onClick={() => history.push("/chat")}
          ></IonIcon>
          <IonPopover trigger="click-trigger">
            <IonList>
              <IonItem>
                {userContact?.firstName} {userContact?.lastName}
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={callOutline} slot="start" />
                <IonText>{userContact?.phone}</IonText>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={mailOutline} slot="start" />
                <IonText>{userContact?.email}</IonText>
              </IonItem>
            </IonList>
          </IonPopover>
          <h2>{property.price.toLocaleString("cs")} Kč</h2>
          <p>
            {property.type} · {property.disposition} · {property.city}
          </p>
          <p>{property.address}</p>
          <p>{details.description}</p>

          {/* Property Details */}
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonLabel>Plocha pozemku: {details.propertySize} m²</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Velikost zahrady: {details.gardenSize} m²</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Patra: {details.floors}</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Koupelny: {details.bathroomCount}</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Pokoje: {details.rooms}</IonLabel>
              </IonCol>
              <IonCol>
                <IonLabel>Parkování: {details.parkingSpots}</IonLabel>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Boolean Features */}
          <IonGrid>
            <IonRow>
              {[
                ["Garáž", property.garage],
                ["Výtah", property.elevator],
                ["Plynové připojení", property.gasConnection],
                ["Třífázová elektřina", property.threePhaseElectricity],
                ["Sklep", property.basement],
                ["Zařízený", property.furnished],
                ["Balkon", property.balcony],
                ["Zahrada", property.garden],
                ["Solární panely", property.solarPanels],
                ["Bazén", property.pool],
              ]
                .filter(([, val]) => val)
                .map(([label], i) => (
                  <IonCol size="6" key={i}>
                    <IonLabel className="boolean-label">
                      <IonIcon
                        icon={checkmarkOutline}
                        slot="start"
                        className="boolean-icon"
                      />
                      {label}
                    </IonLabel>
                  </IonCol>
                ))}
            </IonRow>
          </IonGrid>

          {/* Kitchen Equipment */}
          <h3>Vybavení kuchyně</h3>
          <ul>
            {details.kitchenEquipment.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          {/* Extra */}
          <p>
            <strong>Vytápění:</strong> {details.heatingType}
          </p>
          <p>
            <strong>Rok výstavby:</strong> {details.yearBuilt}
          </p>
          <p>
            <strong>PSČ:</strong> {details.postalCode}
          </p>

          {/* {details.videoUrl && (
          <div className="video-container">
          <iframe
          width="100%"
          height="200"
          src={details.videoUrl}
          title="Video nemovitosti"
          frameBorder="0"
          allowFullScreen
          />
          </div>
          )} */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PropertyDetails;
