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
} from "@ionic/react";
import { useEffect, useState } from "react";
import { notificationsOutline, add } from "ionicons/icons";
import "../styles/Home.css";
import { useHistory } from "react-router";
import { useTabBarScrollEffect } from "../hooks/hideTabBar";

import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { useAuth } from "../hooks/useAuth";
import { auth } from "../firebase";

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

const fetchTrendingProperties = async () => {
  const q = query(collection(db, "trending"), orderBy("views", "desc"));
  const propertiesSnapshot = await getDocs(q);
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TrendingProperty, "id">),
  }));
};

const fetchClosestProperties = async () => {
  const propertiesSnapshot = await getDocs(collection(db, "properties"));
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ClosestProperty, "id">),
  }));
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  useTabBarScrollEffect();
  // const [loading, setLoading] = useState(true);
  const [trendingProperties, setTrendingProperties] = useState<
    TrendingProperty[]
  >([]);
  const [closestProperties, setClosestProperties] = useState<ClosestProperty[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trending = await fetchTrendingProperties();
        const closest = await fetchClosestProperties();
        setTrendingProperties(trending);
        setClosestProperties(closest);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
      // finally {
      //   setLoading(false);
      // }
    };

    fetchData();
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // if (loading) {
  //   return (
  //     <IonContent fullscreen className="ion-padding">
  //       Loading...
  //     </IonContent>
  //   );
  // } else {
  return (
    <IonPage>
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

            {user && (
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
                    <IonBadge
                      color="danger"
                      slot=""
                      className="notification-badge"
                    >
                      0
                    </IonBadge>
                    <IonIcon icon={notificationsOutline} size="large" />
                  </div>
                </IonButton>
              </IonCol>
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
          {trendingProperties.map((trending) => (
            <SwiperSlide
              key={trending.id}
              onClick={() => history.push(`/details/${trending.propertyId}`)}
            >
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

        <IonText>
          <h2 className="heading-text ion-align-items-start ion-justify-content-between ion-padding-horizontal">
            Nemovitosti, které jsou <br />
            ti <strong>nejblíže</strong>
          </h2>
        </IonText>
        {closestProperties.map((property) => (
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
              {/* <IonCardSubtitle>{property.city}</IonCardSubtitle> */}
            </IonCardHeader>
            <IonCardContent>
              <strong>{property.price.toLocaleString()} $</strong>
            </IonCardContent>
          </IonCard>
        ))}

        <IonButton
          expand="block"
          fill="outline"
          className="ion-padding"
          onClick={() => console.log(user)}
        >
          is logged in?
        </IonButton>

        <IonButton onClick={() => history.push("/login")}>
          <IonText className="ion-padding">Login</IonText>
        </IonButton>
        <IonButton onClick={() => history.push("/register")}>
          <IonText className="ion-padding">Register</IonText>
        </IonButton>
        <IonButton onClick={signOut}>
          <IonText className="ion-padding">Sign Out</IonText>
        </IonButton>
      </IonContent>
    </IonPage>
  );
};
// };

export default Home;
