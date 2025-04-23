import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
} from "@ionic/react";
import { useStorage } from "../hooks/useStorage";
import { useEffect, useState } from "react";
import {
  getUserNotificationBoolean,
  updateUserNotificationBoolean,
} from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { Preferences } from "@capacitor/preferences";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const { get, set, ready } = useStorage();
  const [pushEnabled, setPushEnabled] = useState<boolean>(true); //TODO: try speed

  useEffect(() => {
    const applyInitialTheme = async () => {
      if (!ready) return;
      const storedTheme = await get("darkTheme");
      const darkTheme = storedTheme !== null ? storedTheme : false;
      setIsDarkTheme(darkTheme);
      document.documentElement.classList.toggle("ion-palette-dark", darkTheme);
    };

    const fetchPushBoolean = async () => {
      if (!user) return;
      console.log("useeffect...");

      try {
        setPushEnabled(await getUserNotificationBoolean(user.uid));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    applyInitialTheme();
    fetchPushBoolean();
  }, [ready, get, user]);

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    document.documentElement.classList.toggle("ion-palette-dark", newTheme);
    await set("darkTheme", newTheme);
  };

  const toggleNotifications = async () => {
    if (!user) return;

    const newPushEnabled = !pushEnabled;
    setPushEnabled(newPushEnabled);
    await Preferences.set({
      key: "pushEnabled",
      value: newPushEnabled.toString(),
    });

    try {
      updateUserNotificationBoolean(user.uid, newPushEnabled);
    } catch (error) {
      console.error("Error updating notification preference:", error);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle checked={isDarkTheme} onIonChange={toggleTheme} />
          </IonItem>
          <IonItem>
            <IonLabel>Notifications</IonLabel>
            <IonToggle
              checked={pushEnabled}
              onIonChange={toggleNotifications}
            />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
