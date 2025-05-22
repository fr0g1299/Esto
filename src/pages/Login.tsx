import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonContent,
  IonImg,
  IonInput,
  IonInputPasswordToggle,
  IonList,
  IonNote,
  IonPage,
} from "@ionic/react";
import { loginUser } from "../services/authService";
import { hapticsHeavy, hapticsMedium } from "../services/haptics";

import "../styles/LoginAndRegistration.css";

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailValid, setIsEmailValid] = useState<boolean | undefined>(
    undefined
  );
  const [isPassValid, setIsPassValid] = useState<boolean | undefined>(
    undefined
  );
  const [isTouched, setIsTouched] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await hapticsMedium();
    if (!email || !password) {
      setIsEmailValid(false);
      setIsPassValid(false);
      return;
    }

    try {
      const user = await loginUser(email, password);
      console.log("User logged in:", user);

      history.push("/home");
      // eslint-disable-next-line
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          await hapticsHeavy();
          setIsEmailValid(false);
          break;
        case "auth/wrong-password":
          await hapticsHeavy();
          setIsPassValid(false);
          break;
        default:
          console.error("Error logging in user:", error);
      }
    }
  };

  const handleEmailChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value.trim();
    setEmail(value);

    if (value === "") {
      setIsEmailValid(undefined);
      return;
    }

    setIsEmailValid(isValidEmail(value));
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  return (
    <IonPage className="login-page">
      <IonContent fullscreen>
        <div className="content-container">
          <div className="logo-container">
            <IonImg src="assets/logo.svg" alt="Logo" className="logo" />
          </div>
          <div className="input-container">
            <IonList>
              <IonInput
                className={`ion-margin-bottom ${isEmailValid && "ion-valid"} ${
                  isEmailValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="email"
                type="email"
                required
                fill="outline"
                autocomplete="email"
                label="E-mail"
                labelPlacement="stacked"
                errorText="Špatný email"
                onIonInput={(event) => handleEmailChange(event)}
                onIonBlur={() => setIsTouched(true)}
              ></IonInput>
              <IonInput
                className={`${isPassValid && "ion-valid"} ${
                  isPassValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="password"
                type="password"
                onIonInput={(e) => {
                  setIsPassValid(undefined);
                  setPassword(e.detail.value!);
                }}
                required
                fill="outline"
                labelPlacement="stacked"
                label="Heslo"
                errorText="Špatné heslo"
                clearOnEdit={false}
              >
                <IonInputPasswordToggle
                  slot="end"
                  tabIndex={-1}
                ></IonInputPasswordToggle>
              </IonInput>
            </IonList>

            <IonButton onClick={handleLogin} className="ion-margin-top">
              Přihlásit se
            </IonButton>
          </div>
          <IonNote className="note">
            Ještě nemáte účet?&nbsp;&nbsp;
            <strong>
              <a href="/register">Zaregistrujte se</a>
            </strong>
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
