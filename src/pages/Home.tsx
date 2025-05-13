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
  IonButtons,
  IonCardSubtitle,
  IonSkeletonText,
  useIonViewDidEnter,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { notificationsOutline, add } from "ionicons/icons";
import "../styles/Home.css";
import { useHistory } from "react-router";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";

import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { useAuth } from "../hooks/useAuth";

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
    delay: 4500,
    disableOnInteraction: false,
    loop: true,
  },
};

interface NewestProperty {
  id: string;
  title: string;
  price: number;
  city: string;
  imageUrl: string;
}

interface TrendingProperty {
  id: string;
  propertyId: string;
  title: string;
  imageUrl: string;
  price: number;
  views: number;
}

const fetchTrendingProperties = async () => {
  const q = query(collection(db, "trending"), orderBy("views", "desc"));
  const propertiesSnapshot = await getDocs(q);
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TrendingProperty, "id">),
  }));
};

const fetchNewestProperties = async () => {
  const q = query(
    collection(db, "properties"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const propertiesSnapshot = await getDocs(q);
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<NewestProperty, "id">),
  }));
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  useTabBarScrollEffect();
  const [loading, setLoading] = useState(true);
  const [trendingProperties, setTrendingProperties] = useState<
    TrendingProperty[]
  >([]);
  const [newestProperties, setNewestProperties] = useState<NewestProperty[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trending = await fetchTrendingProperties();
        const newest = await fetchNewestProperties();
        setTrendingProperties(trending);
        setNewestProperties(newest);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    getNotificationSize();
  });

  useIonViewDidEnter(() => {
    getNotificationSize();
  }, [user]);

  const getNotificationSize = async () => {
    if (!user) return;

    const unreadQuery = query(
      collection(db, "users", user.uid, "notifications"),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(unreadQuery);
    setUnreadCount(snapshot.size); // For future use, right now size color is transparent
  };

  return (
    <IonPage className="home-page">
      <IonContent fullscreen scrollEvents>
        <IonGrid>
          <IonRow className="ion-align-items-center ion-justify-content-between ion-padding-horizontal">
            <IonCol size="auto">
              <IonText>
                <h2 className="heading-text">
                  Nejvíce <strong>prohlížené</strong> <br />
                  Nemovitosti
                </h2>
              </IonText>
            </IonCol>

            {user ? (
              <IonCol size="auto">
                <IonButton
                  fill="clear"
                  className="create-btn icon-shadow no-ripple"
                  onClick={() => history.push("/create")}
                >
                  <IonIcon icon={add} size="large" />
                </IonButton>
                <IonButton
                  fill="clear"
                  className="notification-btn icon-shadow no-ripple"
                  onClick={() => history.push("/notifications")}
                >
                  <div className="notification-icon-wrapper">
                    {unreadCount > 0 && (
                      <IonBadge slot="" className="notification-badge">
                        0
                      </IonBadge>
                    )}
                    <IonIcon icon={notificationsOutline} size="large" />
                  </div>
                </IonButton>
              </IonCol>
            ) : (
              <a
                className="login"
                onClick={() => {
                  history.push("/login");
                }}
              >
                Přihlásit se
              </a>
            )}
          </IonRow>
        </IonGrid>

        <IonButtons slot="secondary">
          <IonButton
            fill="clear"
            className="create-btn"
            onClick={() => history.push("/create")}
          >
            <IonIcon icon={add} size="large" />
          </IonButton>
        </IonButtons>
        <IonButtons slot="primary">
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
        </IonButtons>

        <Swiper {...slideOpts}>
          {loading
            ? [...Array(5)].map((_, index) => (
                <SwiperSlide key={index}>
                  <IonCard className="property-card-swiper">
                    <IonSkeletonText
                      animated
                      style={{
                        width: "100%",
                        height: "200px",
                        borderRadius: "12px",
                        margin: "0px",
                      }}
                    />
                    <IonCardHeader>
                      <IonCardTitle>
                        <IonSkeletonText
                          animated
                          style={{ width: "60%", height: "20px" }}
                        />
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonSkeletonText
                        animated
                        style={{ width: "30%", height: "13px" }}
                      />
                    </IonCardContent>
                  </IonCard>
                </SwiperSlide>
              ))
            : trendingProperties.map((trending) => (
                <SwiperSlide
                  key={trending.id}
                  onClick={() =>
                    history.push(`/details/${trending.propertyId}`)
                  }
                >
                  <IonCard className="property-card-swiper">
                    <IonImg src={trending.imageUrl} alt={trending.title} />
                    <IonCardHeader>
                      <IonCardTitle
                        className={
                          trending.title.length <= 20
                            ? "title-large"
                            : "title-default"
                        }
                      >
                        {trending.title}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <strong>{trending.price.toLocaleString("cs")} Kč</strong>
                    </IonCardContent>
                  </IonCard>
                </SwiperSlide>
              ))}
        </Swiper>

        <IonText>
          <h2 className="heading-text ion-align-items-start ion-justify-content-between ion-padding-horizontal">
            <strong>Nejnovější</strong> nemovitosti
          </h2>
        </IonText>

        {loading
          ? [...Array(5)].map((_, index) => (
              <IonCard key={index} className="property-card-list">
                <IonSkeletonText
                  animated
                  style={{
                    width: "100%",
                    height: "200px",
                    borderRadius: "8px",
                    margin: "0px",
                  }}
                />
                <IonCardHeader>
                  <IonCardTitle>
                    <IonSkeletonText
                      animated
                      style={{ width: "60%", height: "16px" }}
                    />
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <IonSkeletonText
                      animated
                      style={{ width: "40%", height: "9px" }}
                    />
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSkeletonText
                    animated
                    style={{ width: "30%", height: "17px" }}
                  />
                </IonCardContent>
              </IonCard>
            ))
          : newestProperties.map((property) => (
              <IonCard
                key={property.id}
                className="property-card-list"
                onClick={() => history.push(`/details/${property.id}`)}
              >
                <IonImg
                  src={property.imageUrl}
                  alt={property.title}
                  className="card-image"
                />
                <IonCardHeader>
                  <IonCardTitle>{property.title}</IonCardTitle>
                  <IonCardSubtitle>{property.city}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>{property.price.toLocaleString("cs")} Kč</strong>
                </IonCardContent>
              </IonCard>
            ))}
      </IonContent>
    </IonPage>
  );
};

export default Home;
