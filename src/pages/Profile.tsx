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

const Profile: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const { get, set, ready } = useStorage();

  useEffect(() => {
    const applyInitialTheme = async () => {
      if (!ready) return;
      const storedTheme = await get("darkTheme");
      const darkTheme = storedTheme !== null ? storedTheme : false;
      setIsDarkTheme(darkTheme);
      document.documentElement.classList.toggle("ion-palette-dark", darkTheme);
    };

    applyInitialTheme();
  }, [ready, get]);

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    document.documentElement.classList.toggle("ion-palette-dark", newTheme);
    await set("darkTheme", newTheme);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle checked={isDarkTheme} onIonChange={toggleTheme} />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
