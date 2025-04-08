import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React, { useState } from "react";
import { loginUser } from "../services/authService";
import { useHistory } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = await loginUser(email, password);
      console.log("User logged in:", user);

      history.push("/home");
    } catch (error) {
      console.error("Error logging in user:", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonInput
          id="email"
          type="email"
          placeholder="Enter your email"
          onIonChange={(e) => setEmail(e.detail.value!)}
          required
          fill="solid"
          label="Email"
          labelPlacement="floating"
        ></IonInput>
        <IonInput
          id="password"
          type="password"
          onIonInput={(e) => setPassword(e.detail.value!)}
          required
          fill="solid"
          label="Password "
        >
          <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
        </IonInput>
        <IonButton
          expand="full"
          onClick={handleLogin}
          type="submit"
          className="ion-padding"
        >
          Login
        </IonButton>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </IonContent>
    </IonPage>
  );
};

export default Login;
