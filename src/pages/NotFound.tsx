import { IonContent, IonPage, IonButton, IonIcon, IonText } from "@ionic/react";
import { alertCircleOutline, homeOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

import "../styles/NotFound.css";

const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage className="not-found">
      <IonContent fullscreen className="ion-padding ion-text-center">
        <div className="center">
          <IonIcon icon={alertCircleOutline} size="large" color="danger" />
          <h2>Jejda! Stránka nebyla nalezena</h2>
          <IonText color="medium">
            <p>
              Stránka, kterou hledáte, neexistuje nebo došlo k nějaké chybě.
            </p>
          </IonText>
          <IonButton
            expand="block"
            onClick={() => history.push("/home")}
            className="ion-margin-top"
          >
            <IonIcon icon={homeOutline} slot="start" className="icon-align" />
            Zpět na domovskou stránku
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;
