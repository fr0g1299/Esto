import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabBar,
  IonTabs,
  setupIonicReact,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";
import { useStorage } from "./hooks/useStorage";
import Home from "./pages/Home";
import SearchMap from "./pages/SearchMap";
import Search from "./pages/Search";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import PropertyDetails from "./pages/PropertyDetails";
import Notifications from "./pages/Notifications";
import Create from "./pages/Create";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { home, search, albums, person, mapOutline } from "ionicons/icons";
import RippleButton from "./components/ui/RippleButton";
import { AuthProvider } from "./contexts/AuthProvider";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

// import '@ionic/react/css/palettes/dark.always.css';
import "@ionic/react/css/palettes/dark.class.css";
// import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import "./styles/global.css";
import "./styles/App.css";
import PrivateRoute from "./components/PrivateRoute";

setupIonicReact();

const App: React.FC = () => {
  const { get, ready } = useStorage();

  useEffect(() => {
    const applyInitialTheme = async () => {
      if (!ready) return;
      const storedTheme = await get("darkTheme");
      const darkTheme = storedTheme !== null ? storedTheme : false;
      document.documentElement.classList.toggle("ion-palette-dark", darkTheme);
    };

    applyInitialTheme();
  }, [get, ready]);

  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/home" component={Home} />
              <Route exact path="/searchmap" component={SearchMap} />
              <Route exact path="/search" component={Search} />
              <Route exact path="/collections" component={Collection} />
              <Route exact path="/profile" component={Profile} />
              <Route exact path="/details/:id" component={PropertyDetails} />
              <Route exact path="/results" component={SearchResults} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <PrivateRoute
                exact
                path="/notifications"
                component={Notifications}
              />
              <PrivateRoute exact path="/create" component={Create} />
              <Route exact path="/" render={() => <Redirect to="/home" />} />
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={home} />
                <IonLabel>Domů</IonLabel>
              </IonTabButton>

              <IonTabButton tab="searchmap" href="/searchmap">
                <IonIcon icon={mapOutline} />
                <IonLabel>Mapa</IonLabel>
              </IonTabButton>
              <IonTabButton tab="search" href="/search" className="no-ripple">
                <div className="place">
                  <RippleButton
                    icon={<IonIcon icon={search} className="text-2xl" />}
                    className="custom-ripple-btn"
                  />
                </div>
                <IonLabel className="search-label">Hledat</IonLabel>
              </IonTabButton>

              <IonTabButton tab="collections" href="/collections">
                <IonIcon icon={albums} />
                <IonLabel>Kolekce</IonLabel>
              </IonTabButton>

              <IonTabButton tab="profile" href="/profile">
                <IonIcon icon={person} />
                <IonLabel>Profil</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
