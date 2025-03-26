import {
  IonContent,
  IonIcon,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonImg,
} from "@ionic/react";
import { notificationsOutline } from "ionicons/icons";
import "../styles/Home.css";
import { useHistory } from "react-router";

import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

import { useEffect, useState } from "react";

const slideOpts = {
  slidesPerView: 1.2,
  spaceBetween: -80,
  centeredSlides: true,
  effect: "coverflow",
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: false,
  },
  modules: [Autoplay, EffectCoverflow],
  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
    loop: true,
  },
};

interface ClosestProperty {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
} // new properties, maybe even in your area

interface TrendingProperty {
  id: string;
  propertyId: string;
  title: string;
  imageUrl: string;
  price: number;
  views: number;
}

const Home: React.FC = () => {
  const history = useHistory();
  const [trendingProperties, setTrendingProperties] = useState<
    TrendingProperty[]
  >([]);
  const [closestProperties, setClosestProperties] = useState<ClosestProperty[]>(
    []
  );

  useEffect(() => {
    const fetchTrendingProperties = async () => {
      const q = query(collection(db, "trending"), orderBy("views", "desc"));
      const propertiesSnapshot = await getDocs(q);
      const data: TrendingProperty[] = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrendingProperty, "id">),
      }));
      console.log(data);
      setTrendingProperties(data);
    };

    const fetchClosestProperties = async () => {
      const propertiesSnapshot = await getDocs(collection(db, "properties"));
      const data: ClosestProperty[] = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ClosestProperty, "id">),
      }));
      console.log(data);
      setClosestProperties(data);
    };

    fetchClosestProperties();
    fetchTrendingProperties();
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow className="ion-align-items-start ion-justify-content-between ion-padding-horizontal">
            <IonCol size="auto">
              <IonText>
                <h2 className="heading-text">
                  Najdi <strong>Nemovitost</strong> <br />
                  Přímo pro Tebe
                </h2>
              </IonText>
            </IonCol>

            <IonCol size="auto">
              <IonButton
                fill="clear"
                className="notification-btn"
                onClick={() => history.push("/notifications")}
              >
                <IonBadge color="danger" slot="" className="notification-badge">
                  0
                </IonBadge>
                <IonIcon icon={notificationsOutline} size="large" />
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <Swiper {...slideOpts}>
          {trendingProperties.map((trending) => (
            <SwiperSlide key={trending.id}>
              <IonCard className="property-card-swiper">
                <IonImg src={trending.imageUrl} alt={trending.title} />
                <IonCardHeader>
                  <IonCardTitle>{trending.title}</IonCardTitle>
                  {/* <IonCardSubtitle>{trending.city}</IonCardSubtitle> */}
                </IonCardHeader>
                <IonCardContent>
                  <strong>{trending.price.toLocaleString()} $</strong>
                </IonCardContent>
              </IonCard>
            </SwiperSlide>
          ))}
        </Swiper>

        {closestProperties.map((property) => (
          <IonCard key={property.id} className="property-card-list">
            <IonImg
              src={property.imageUrl}
              alt={property.title}
              className="card-image"
            />
            <IonCardHeader>
              <IonCardTitle>{property.title}</IonCardTitle>
              {/* <IonCardSubtitle>{property.city}</IonCardSubtitle> */}
            </IonCardHeader>
            <IonCardContent>
              <strong>{property.price.toLocaleString()} $</strong>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default Home;
