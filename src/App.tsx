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
import PropertyDetails from "./pages/PropertyDetails";
import Notifications from "./pages/Notifications";
import Create from "./pages/Create";
import SearchResults from "./pages/SearchResults";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { home, search, albums, mapOutline, settings } from "ionicons/icons";
import RippleButton from "./components/ui/RippleButton";
import { AuthProvider } from "./contexts/AuthProvider";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { ScreenOrientation } from "@capacitor/screen-orientation";

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
import Chat from "./pages/Chat";
import Chats from "./pages/Chats";
import Folder from "./pages/Folder";
import UserListings from "./pages/UserListings";
import EditProperty from "./pages/EditProperty";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { useAuth } from "./hooks/useAuth";
import { setNotificationPreference } from "./services/notificationsService";
import { SafeArea } from "capacitor-plugin-safe-area";
import { StatusBar, Style } from "@capacitor/status-bar";
import AdminDashboard from "./components/AdminDashboard";
import { Capacitor } from "@capacitor/core";

setupIonicReact();

const App: React.FC = () => {
  const { get, ready } = useStorage();
  const { user } = useAuth();
  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      ScreenOrientation.lock({ orientation: "portrait" });
    }
  }, []);

  useEffect(() => {
    const applyInitialTheme = async () => {
      if (!ready) return;
      const storedTheme = await get("darkTheme");
      const darkTheme = storedTheme !== null ? storedTheme : false;
      document.documentElement.classList.toggle("ion-palette-dark", darkTheme);
    };

    const setSafeArea = async () => {
      const safeArea = await SafeArea.getSafeAreaInsets();
      const top = safeArea.insets?.top || 0;
      const bottom = safeArea.insets?.bottom || 0;
      console.log("Safe area insets:", safeArea);
      document.documentElement.style.setProperty(
        "--safe-area-inset-top",
        `${top}px`
      );
      document.documentElement.style.setProperty(
        "--safe-area-inset-bottom",
        `${bottom}px`
      );
    };

    const initPushPreference = async () => {
      const stored = await Preferences.get({ key: "pushNotificationsEnabled" });

      if (!stored.value && user) {
        await setNotificationPreference(user.uid, true);
      }
    };

    applyInitialTheme();
    initPushPreference();
    if (Capacitor.getPlatform() !== "web") {
      setSafeArea();
    }
  }, [get, ready, user]);

  useEffect(() => {
    const applyStatusBarStyle = async () => {
      try {
        // Transparent background + overlay
        await StatusBar.setBackgroundColor({ color: "#00000000" });
        await StatusBar.setOverlaysWebView({ overlay: true });

        // Initial style based on theme
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        await StatusBar.setStyle({
          style: prefersDark ? Style.Dark : Style.Light,
        });
      } catch (err) {
        console.warn("StatusBar setup failed:", err);
      }
    };

    if (Capacitor.getPlatform() !== "web") {
      applyStatusBarStyle();
    }
  }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });

      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("Push received", notification);
        }
      );

      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (result) => {
          console.log("Notification action performed", result.notification);
        }
      );
    }
  }, []);

  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/" render={() => <Redirect to="/home" />} />
              <Route exact path="/home" component={Home} />
              <Route exact path="/searchmap" component={SearchMap} />
              <Route exact path="/search" component={Search} />
              <Route exact path="/collections" component={Collection} />
              <Route exact path="/settings" component={Settings} />
              <Route
                exact
                path="/details/:propertyId"
                component={PropertyDetails}
              />
              <Route exact path="/results" component={SearchResults} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <Route exact path="/not-found" component={NotFound} />
              <Route component={NotFound} />

              <PrivateRoute exact path="/chat/:chatId" component={Chat} />
              <PrivateRoute exact path="/chats" component={Chats} />
              <PrivateRoute
                exact
                path="/collection/folder/:folderId"
                component={Folder}
              />
              <PrivateRoute
                exact
                path="/userListings"
                component={UserListings}
              />
              <PrivateRoute
                exact
                path="/notifications"
                component={Notifications}
              />
              <PrivateRoute
                exact
                path="/edit/:propertyId"
                component={EditProperty}
              />
              <PrivateRoute exact path="/create" component={Create} />

              <PrivateRoute exact path="/admin" component={AdminDashboard} />
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
                  <div className="dots">
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
                <IonLabel className="search-label">Hledat</IonLabel>
              </IonTabButton>

              <IonTabButton tab="collections" href="/collections">
                <IonIcon icon={albums} />
                <IonLabel>Kolekce</IonLabel>
              </IonTabButton>

              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={settings} />
                <IonLabel>Nastavení</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
