import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router";
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
  IonItemDivider,
  useIonViewWillEnter,
  IonRefresher,
  IonRefresherContent,
  useIonToast,
} from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import { Network } from "@capacitor/network";
import { useAuth } from "../hooks/useAuth";
import { useStorage } from "../hooks/useStorage";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import {
  fetchTrendingProperties,
  fetchNewestProperties,
} from "../services/propertyService";
import { fetchUnreadNotificationCount } from "../services/notificationsService";
import {
  TrendingProperty,
  NewestProperty,
  OfflineProperty,
} from "../types/interfaces";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { notificationsOutline, add, refresh } from "ionicons/icons";
import "../styles/Home.css";

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

const Home: React.FC = () => {
  const { user } = useAuth();
  const { get } = useStorage();
  const history = useHistory();
  const [showToast] = useIonToast();
  useTabBarScrollEffect();
  const [loading, setLoading] = useState(true);
  
  const [trendingProperties, setTrendingProperties] = useState<
    TrendingProperty[]
  >([]);
  const [newestProperties, setNewestProperties] = useState<NewestProperty[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [offlineProperties, setOfflineProperties] = useState<OfflineProperty[]>(
    []
  );
  const [isOnline, setIsOnline] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    Network.addListener("networkStatusChange", (status) =>
      setIsOnline(status.connected)
    );

    checkStatus();
  }, []);

  const getNotificationSize = useCallback(async () => {
    if (!user) return;

    const unreadNotCount = await fetchUnreadNotificationCount(user);

    setUnreadCount(unreadNotCount); // For future use, right now size color is transparent
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLogin(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (isOnline) {
        // Fetch from Firestore
        const trending = await fetchTrendingProperties();
        const newest = await fetchNewestProperties();
        setTrendingProperties(trending);
        setNewestProperties(newest);
      } else {
        // Load from local storage
        const offlineData = await get("properties");
        if (offlineData) setOfflineProperties(offlineData);
        console.log("Offline data loaded:", offlineData);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, get]);

  useEffect(() => {
    fetchData();
    getNotificationSize();
  }, [fetchData, getNotificationSize]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    if (!isOnline) {
      showToast("Nelze obnovit v offline režimu", 1500);
      event.detail.complete();
      return;
    }
    setLoading(true);
    await fetchData();
    await getNotificationSize();
    event.detail.complete();
  };

  useIonViewWillEnter(() => {
    getNotificationSize();
  }, [user]);

  if (!isOnline) {
    return (
      <IonPage className="home-page">
        <IonContent fullscreen scrollEvents>
          <IonGrid>
            <IonRow className="ion-align-items-center ion-justify-content-between ion-padding-horizontal">
              <IonCol size="auto">
                <IonText>
                  <IonItemDivider style={{ borderBottom: "none" }}>
                    <h2 className="heading-text">
                      <strong>Offline Režim</strong> <br />
                    </h2>
                  </IonItemDivider>
                  <h2 className="heading-text">
                    <strong>Stažené Nemovitosti</strong> <br />
                    pro offline prohlížení
                  </h2>
                </IonText>
              </IonCol>
            </IonRow>
          </IonGrid>

          {loading ? (
            [...Array(5)].map((_, index) => (
              <IonCard key={index} className="property-card-list">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonSkeletonText
                      animated
                      style={{ width: "80%", height: "20px" }}
                    ></IonSkeletonText>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <IonSkeletonText
                      animated
                      style={{ width: "10%" }}
                    ></IonSkeletonText>
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSkeletonText
                    animated
                    style={{ width: "30%", height: "14px" }}
                  ></IonSkeletonText>
                </IonCardContent>
              </IonCard>
            ))
          ) : offlineProperties.length > 0 ? (
            offlineProperties.map((property) => (
              <IonCard
                key={property.propertyId}
                className="property-card-list"
                onClick={() => {
                  console.log("Offline property clicked:", property);
                  history.push(`/offline/${property.propertyId}`);
                }}
              >
                <IonCardHeader>
                  <IonCardTitle>{property.title}</IonCardTitle>
                  <IonCardSubtitle>{property.city}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>{property.price.toLocaleString("cs")} Kč</strong>
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            <IonCard className="property-card-list">
              <IonCardHeader>
                <IonCardTitle>Nemáte uloženy žádné nemovitosti.</IonCardTitle>
              </IonCardHeader>
            </IonCard>
          )}
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="home-page">
      <IonContent fullscreen scrollEvents>
        <IonRefresher
          slot="fixed"
          onIonRefresh={handleRefresh}
          pullMin={100}
          disabled={loading || !isOnline}
          pullMax={200}
        >
          <IonRefresherContent
            pullingIcon={refresh}
            pullingText="Stáhněte pro obnovení"
            refreshingSpinner="crescent"
            refreshingText="Obnovuji..."
          />
        </IonRefresher>
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
                  <IonIcon icon={add} className="icon" />
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
                    <IonIcon icon={notificationsOutline} className="icon" />
                  </div>
                </IonButton>
              </IonCol>
            ) : (
              <a
                className={`login${showLogin ? " visible" : ""}`}
                onClick={async () => history.push("/login")}
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
