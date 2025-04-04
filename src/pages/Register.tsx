import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonInputPasswordToggle,
} from "@ionic/react";
import React, { useState } from "react";
import { registerUser } from "../services/authService";
import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import { useMaskito } from "@maskito/react";
import { useHistory } from "react-router-dom";

import "../styles/Register.css";

import { query, where, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

const isUsernameTaken = async (username: string): Promise<boolean> => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageConfirm, setErrorMessageConfirm] = useState("");

  const [isTouched, setIsTouched] = useState(false);
  const [isValid, setIsValid] = useState<boolean>();
  const phoneMaskOptions: MaskitoOptions = {
    mask: [
      "+",
      "4",
      "2",
      "0",
      " ",
      /\d/,
      /\d/,
      /\d/,
      " ",
      /\d/,
      /\d/,
      /\d/,
      " ",
      /\d/,
      /\d/,
      /\d/,
    ],
  };
  const phoneMask = useMaskito({ options: phoneMaskOptions });
  const [phone, setPhone] = useState(
    maskitoTransform("+420", phoneMaskOptions)
  );

  const validateEmail = (email: string) => {
    return email.match(
      /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    );
  };

  const validate = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;

    setIsValid(undefined);

    if (value === "") return;

    setIsValid(validateEmail(value) !== null);
    setEmail(value);
  };

  const markTouched = () => {
    setIsTouched(true);
  };

  const handlePasswordChange = (e: CustomEvent) => {
    const pass = e.detail.value;
    setPassword(pass);
    if (pass.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
    } else if (confirmPassword && pass !== confirmPassword) {
      setErrorMessageConfirm("Passwords do not match");
    } else {
      setErrorMessage("");
      setErrorMessageConfirm("");
    }
  };

  const handleConfirmPasswordChange = (e: CustomEvent) => {
    const confirm = e.detail.value;
    setConfirmPassword(confirm);

    console.log("Confirm password:", confirm);
    console.log("Password:", password);

    if (password !== confirm) {
      setErrorMessageConfirm("Passwords do not match");
    } else {
      console.log("Passwords match");
      setErrorMessageConfirm("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const taken = await isUsernameTaken(username);
    if (taken) {
      alert("Username is already taken."); // TODO: Something better
      return;
    }

    try {
      const user = await registerUser(email, password, {
        username,
        phone,
        firstName,
        lastName,
        pushNotificationsEnabled,
      });
      console.log("User registered:", user);

      history.push("/home");
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  // TODO: Add error handling for registration
  // TODO: What if the user is already registered?

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonInput
          className={`${isValid && "ion-valid"} ${
            isValid === false && "ion-invalid"
          } ${isTouched && "ion-touched"}`}
          id="email"
          type="email"
          required
          placeholder="Enter your email"
          fill="solid"
          autocomplete="email"
          label="Email"
          labelPlacement="floating"
          errorText="Invalid email format"
          onIonInput={(event) => validate(event)}
          onIonBlur={() => markTouched()}
        ></IonInput>

        <IonInput
          id="password"
          type="password"
          onIonInput={handlePasswordChange}
          required
          clearOnEdit={false}
          fill="solid"
          label="Password "
        >
          <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
        </IonInput>

        <IonText color="danger">{errorMessage}</IonText>

        <IonInput
          id="confirm-password"
          type="password"
          onIonInput={handleConfirmPasswordChange}
          required
          clearOnEdit={false}
          fill="solid"
          label="Confirm "
        >
          <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
        </IonInput>

        <IonText color="danger">{errorMessageConfirm}</IonText>

        <IonInput
          id="username"
          type="text"
          placeholder="Enter your username"
          onIonChange={(e) => setUsername(e.detail.value!)}
          required
          fill="solid"
          label="Username"
          labelPlacement="floating"
        ></IonInput>

        <IonInput
          ref={(phoneInput) => {
            if (phoneInput) {
              phoneInput.getInputElement().then((input) => {
                phoneMask(input);
              });
            }
          }}
          id="phone"
          type="text"
          value={phone}
          placeholder="+420 xxx xxx xxx"
          onIonInput={(e) => setPhone(e.detail.value!)}
          required
          fill="solid"
          label="Phone Number"
          labelPlacement="floating"
        ></IonInput>

        <IonInput
          id="first-name"
          type="text"
          placeholder="Enter your first name"
          onIonChange={(e) => setFirstName(e.detail.value!)}
          required
          fill="solid"
          label="First Name"
          labelPlacement="floating"
        ></IonInput>

        <IonInput
          id="last-name"
          type="text"
          placeholder="Enter your last name"
          onIonChange={(e) => setLastName(e.detail.value!)}
          required
          fill="solid"
          label="Last Name"
          labelPlacement="floating"
        ></IonInput>

        <IonCheckbox
          id="notifications"
          value="notifications"
          onIonChange={(e) => setPushNotificationsEnabled(e.detail.checked)}
          checked={true}
          className="ion-padding"
        >
          Enable Push Notifications
        </IonCheckbox>
        <IonButton
          disabled={
            !email ||
            !password ||
            !confirmPassword ||
            !username ||
            !phone ||
            !firstName ||
            !lastName ||
            password !== confirmPassword ||
            password.length < 6
          }
          onClick={handleRegister}
          type="submit"
          expand="full"
          className="ion-padding"
        >
          Register
        </IonButton>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </IonContent>
    </IonPage>
  );
};

export default Register;
