import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonInputPasswordToggle,
  IonImg,
  IonList,
  IonNote,
  IonLoading,
  useIonToast,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { registerUser } from "../services/authService";
import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import { useMaskito } from "@maskito/react";
import { useHistory } from "react-router-dom";
import "../styles/LoginAndRegistration.css";
import { hapticsHeavy, hapticsMedium } from "../services/haptics";

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast] = useIonToast();

  const [isTouched, setIsTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean | undefined>(
    undefined
  );
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

  const handleEmailChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value.trim();
    setEmail(value);
    setEmailMessage("Špatný email");

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

  const markTouched = () => {
    setIsTouched(true);
  };

  const [emailMessage, setEmailMessage] = useState("Špatný email");
  const [usernameMessage, setUsernameMessage] = useState(
    "Uživatelské jméno je povinné"
  );
  const [isPassValid, setIsPassValid] = useState<boolean>();
  const [isPassConfirmValid, setIsPassConfirmValid] = useState<boolean>();
  const [isUserNameValid, setIsUserNameValid] = useState<boolean>();
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>();
  const [isFirstNameValid, setIsFirstNameValid] = useState<boolean>();
  const [isLastNameValid, setIsLastNameValid] = useState<boolean>();

  useEffect(() => {
    if (password.length < 6) {
      setIsPassValid(false);
    } else if (password !== confirmPassword) {
      setIsPassValid(true);
      setIsPassConfirmValid(false);
    } else {
      setIsPassValid(true);
      setIsPassConfirmValid(true);
    }
    setIsUserNameValid(true);
    setIsPhoneValid(true);
    setIsFirstNameValid(true);
    setIsLastNameValid(true);
  }, [password, confirmPassword, username, phone, firstName, lastName]);

  const handleValidation = () => {
    if (!username) {
      setUsernameMessage("Uživatelské jméno je povinné");
      hapticsHeavy();
      setIsUserNameValid(false);
    } else {
      setIsUserNameValid(true);
    }
    if (phone === "+420") {
      hapticsHeavy();
      setIsPhoneValid(false);
    } else if (phone.length < 16) {
      hapticsHeavy();
      setIsPhoneValid(false);
    } else {
      setIsPhoneValid(true);
    }
    if (!firstName) {
      hapticsHeavy();
      setIsFirstNameValid(false);
    } else {
      setIsFirstNameValid(true);
    }
    if (!lastName) {
      hapticsHeavy();
      setIsLastNameValid(false);
    } else {
      setIsLastNameValid(true);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    handleValidation();

    if (
      !isEmailValid ||
      !isPassValid ||
      !isPassConfirmValid ||
      !isUserNameValid ||
      !isPhoneValid ||
      !isFirstNameValid ||
      !isLastNameValid
    ) {
      hapticsHeavy();
      showToast("Vyplňte všechna pole správně", 1500);
      return;
    }

    try {
      setLoading(true);
      await hapticsMedium();

      const user = await registerUser(email, password, {
        username,
        phone,
        firstName,
        lastName,
      });

      setLoading(false);
      console.log("User registered:", user);

      history.push("/home");
      // eslint-disable-next-line
    } catch (error: any) {
      setLoading(false);
      switch (error.code) {
        case "auth/username-taken":
          setUsernameMessage("Uživatelské jméno je již obsazeno");
          hapticsHeavy();
          setIsUserNameValid(false);
          break;
        case "auth/email-already-in-use":
          setEmailMessage("E-mail je již zaregistrován");
          hapticsHeavy();
          setIsEmailValid(false);
          break;
        case "auth/password-does-not-meet-requirements":
          hapticsHeavy();
          setIsPassValid(false);
          break;
        default:
          console.error("Error registering user:", error);
      }
    }
  };

  return (
    <IonPage className="registration-page">
      <IonContent fullscreen>
        <div className="content-container">
          <div className="logo-container">
            <IonImg src="assets/logo.svg" alt="Logo" className="logo smaller" />
          </div>
          <div className="input-container">
            <IonList>
              <IonInput
                className={`${isEmailValid && "ion-valid"} ${
                  isEmailValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="email"
                type="email"
                required
                fill="outline"
                autocomplete="email"
                label="E-mail"
                labelPlacement="stacked"
                placeholder="Zadejte e-mail"
                errorText={emailMessage}
                onIonInput={(event) => handleEmailChange(event)}
                onIonBlur={() => markTouched()}
              ></IonInput>

              <IonInput
                className={`${isPassValid && "ion-valid"} ${
                  isPassValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="password"
                type="password"
                onIonInput={(e) => setPassword(e.detail.value!.trim())}
                required
                clearOnEdit={false}
                fill="outline"
                label="Heslo"
                labelPlacement="stacked"
                placeholder="Zadejte heslo"
                errorText="Heslo musí mít alespoň 6 znaků"
              >
                <IonInputPasswordToggle
                  slot="end"
                  tabIndex={-1}
                ></IonInputPasswordToggle>
              </IonInput>

              <IonInput
                className={`${isPassConfirmValid && "ion-valid"} ${
                  isPassConfirmValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="confirm-password"
                type="password"
                onIonInput={(e) => setConfirmPassword(e.detail.value!.trim())}
                required
                clearOnEdit={false}
                fill="outline"
                label="Potvrzení hesla"
                labelPlacement="stacked"
                placeholder="Zadejte heslo znovu"
                errorText="Hesla se neshodují"
              >
                <IonInputPasswordToggle
                  slot="end"
                  tabIndex={-1}
                ></IonInputPasswordToggle>
              </IonInput>

              <IonInput
                className={`${isUserNameValid && "ion-valid"} ${
                  isUserNameValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="username"
                type="text"
                placeholder="Zadejte své uživatelské jméno"
                onIonInput={(e) => setUsername(e.detail.value!.trim())}
                required
                fill="outline"
                label="Uživatelské jméno"
                labelPlacement="stacked"
                errorText={usernameMessage}
              ></IonInput>

              <IonInput
                className={`${isPhoneValid && "ion-valid"} ${
                  isPhoneValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                ref={(phoneInput) => {
                  if (phoneInput) {
                    phoneInput.getInputElement().then((input) => {
                      phoneMask(input);
                    });
                  }
                }}
                id="phone"
                type="tel"
                value={phone}
                placeholder="Zadejte telefonní číslo"
                onIonInput={(e) => setPhone(e.detail.value!.trim())}
                required
                fill="outline"
                label="Telefonní číslo"
                labelPlacement="stacked"
                errorText="Telefonní číslo je povinné"
              ></IonInput>

              <IonInput
                className={`${isFirstNameValid && "ion-valid"} ${
                  isFirstNameValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="first-name"
                type="text"
                placeholder="Zadejte své křestní jméno"
                onIonInput={(e) => {
                  const filtered = e.detail.value!.replace(
                    /[^a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g,
                    ""
                  );
                  setFirstName(filtered.trim());
                  e.target.value = filtered;
                }}
                required
                fill="outline"
                label="Křestní jméno"
                labelPlacement="stacked"
                errorText="Křestní jméno je povinné"
              ></IonInput>

              <IonInput
                className={`${isLastNameValid && "ion-valid"} ${
                  isLastNameValid === false && "ion-invalid"
                } ${isTouched && "ion-touched"}`}
                id="last-name"
                type="text"
                placeholder="Zadejte své příjmení"
                onIonInput={(e) => {
                  const filtered = e.detail.value!.replace(
                    /[^a-záčďéěíňóřšťúůýžA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g,
                    ""
                  );
                  setLastName(filtered.trim());
                  e.target.value = filtered;
                }}
                required
                fill="outline"
                label="Příjmení"
                labelPlacement="stacked"
                errorText="Příjmení je povinné"
              ></IonInput>
            </IonList>

            <IonButton
              disabled={!isEmailValid || !isPassValid || !isPassConfirmValid}
              onClick={handleRegister}
            >
              Registrovat se
            </IonButton>
          </div>
          <IonNote className="note">
            Už máte účet?&nbsp;&nbsp;
            <strong>
              <a href="/login">Přihlásit se</a>
            </strong>
          </IonNote>
        </div>
      </IonContent>
      <IonLoading
        isOpen={loading}
        message="Registrace probíhá..."
        spinner="crescent"
      />
    </IonPage>
  );
};

export default Register;
