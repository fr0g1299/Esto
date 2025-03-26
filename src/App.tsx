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
import Home from "./pages/Home";
import SearchMap from "./pages/SearchMap";
import Create from "./pages/Create";
import Collection from "./pages/Collection";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { home, search, add, albums, person } from "ionicons/icons";

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

/* import '@ionic/react/css/palettes/dark.always.css'; */
import "@ionic/react/css/palettes/dark.class.css";
// import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import "./styles/App.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/searchmap" component={SearchMap} />
          <Route exact path="/create" component={Create} />
          <Route exact path="/collections" component={Collection} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/notifications" component={Notifications} />
          <Route exact path="/" render={() => <Redirect to="/home" />} />
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
            <IonIcon icon={home} />
            <IonLabel>Domů</IonLabel>
          </IonTabButton>

          <IonTabButton tab="searchmap" href="/searchmap">
            <IonIcon icon={search} />
            <IonLabel>Mapa</IonLabel>
          </IonTabButton>

          <IonTabButton
            tab="create"
            href="/create"
            className="create-tab-button"
          >
            <IonIcon icon={add} />
            <IonLabel>Vytvořit</IonLabel>
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
  </IonApp>
);

export default App;
