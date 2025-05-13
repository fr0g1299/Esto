import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonItemDivider,
  IonInput,
  IonButton,
  IonModal,
  IonIcon,
  IonText,
  IonNote,
  useIonToast,
  IonAlert,
} from "@ionic/react";
import { useStorage } from "../hooks/useStorage";
import { useEffect, useRef, useState } from "react";
import {
  deleteUserAccount,
  getUserDocument,
  updateUserDocument,
  updateUserNotificationBoolean,
} from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { Preferences } from "@capacitor/preferences";
import FormInput from "../components/ui/FormInput";
import { useMaskito } from "@maskito/react";
import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import "../styles/Settings.css";
import { arrowBackOutline, mailOutline } from "ionicons/icons";
import { changeUserPassword, logoutUser } from "../services/authService";
import { useHistory } from "react-router";
import { StatusBar, Style } from "@capacitor/status-bar";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const { get, set, ready } = useStorage();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const modal = useRef<HTMLIonModalElement>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageConfirm, setErrorMessageConfirm] = useState("");
  const [deleteCheck, setDeleteCheck] = useState<string>("");
  const [saveButtonMessage, setSaveButtonMessage] = useState("");
  const [showToast] = useIonToast();

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

  useEffect(() => {
    setSaveButtonMessage(
      !oldPassword ? "K uložení změn vložte své heslo" : "Uložit změny"
    );
  }, [oldPassword]);

  useEffect(() => {
    const applyInitialTheme = async () => {
      if (!ready) return;
      const storedTheme = await get("darkTheme");
      const darkTheme = storedTheme !== null ? storedTheme : false;
      setIsDarkTheme(darkTheme);
      document.documentElement.classList.toggle("ion-palette-dark", darkTheme);
    };

    applyInitialTheme();
  }, [ready, get, user]);

  const fetchUserDocument = async () => {
    if (!user) return;

    const userDocument = await getUserDocument(user.uid);
    if (userDocument) {
      setFirstName(userDocument.firstName);
      setLastName(userDocument.lastName);
      setPhone(userDocument.phone);
      setPushEnabled(userDocument.pushNotificationsEnabled);
    } else {
      console.error("User document not found");
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    console.log("Stored theme:", newTheme);
    if (newTheme) {
      StatusBar.setStyle({ style: Style.Dark });
    } else {
      StatusBar.setStyle({ style: Style.Light });
    }
    requestAnimationFrame(() => {
      document.documentElement.classList.toggle("ion-palette-dark", newTheme);
    });
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
  const handlePasswordChange = (e: string) => {
    const pass = e;
    setNewPassword(pass);
    if (pass.length < 6 && pass.length != 0) {
      setErrorMessage("Password must be at least 6 characters long");
    } else {
      setErrorMessage("");
      setErrorMessageConfirm("");
    }
    if (pass !== confirmPassword && pass.length != 0) {
      setErrorMessageConfirm("Passwords do not match");
    } else {
      setErrorMessageConfirm("");
    }
  };

  const handleConfirmPasswordChange = (e: string) => {
    const confirm = e;
    setConfirmPassword(confirm);

    console.log("Confirm password:", confirm);
    console.log("Password:", newPassword);
    console.log(newPassword.length);

    if (newPassword !== confirm) {
      setErrorMessageConfirm("Passwords do not match");
    } else {
      console.log("Passwords match");
      setErrorMessageConfirm("");
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    updateUserDocument(user.uid, firstName, lastName, phone);

    if (newPassword) {
      try {
        await changeUserPassword(oldPassword, newPassword);
        showToast("Heslo bylo úspěšně změněno.", 2500);
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          "message" in error
        ) {
          if (error.code === "auth/invalid-credential") {
            showToast("Stávající heslo je nesprávné.", 2500);
          } else if (error.code === "auth/weak-password") {
            showToast(
              "Nové heslo je příliš slabé - minimální délka je 6 znaků.",
              2500
            );
          } else {
            console.log(error.message);
          }
        }
      }
    }
  };

  const handleDeleteAccount = async (password: string) => {
    try {
      await deleteUserAccount(password);
      await set("viewedHistory", []);

      showToast("Váš účet byl úspěšně smazán", 2500);
      history.push("/home");
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        "message" in error
      ) {
        const firebaseError = error as { code: string; message: string };
        if (firebaseError.code === "auth/invalid-credential") {
          showToast("Zadané heslo je nesprávné.", 2500);
        } else if (firebaseError.code === "auth/user-not-found") {
          showToast("Uživatel s tímto emailem neexistuje.", 2500);
        } else {
          console.log("firebase: " + firebaseError.message);
        }
      } else {
        console.log(error);
      }
    }
  };

  return (
    <IonPage className="settings">
      <IonContent fullscreen className="ion-padding">
        <IonItemDivider className="item-divider-space-between">
          <IonLabel>Profil</IonLabel>
          {user && (
            <a
              className="logout"
              onClick={() => {
                logoutUser();
                history.push("/home");
              }}
            >
              Odhlásit se
            </a>
          )}
        </IonItemDivider>
        <IonList className="input-list">
          {/* Profile Customization Section */}
          {user ? (
            <>
              <IonItem id="open-modal" lines="none">
                <IonLabel>Úprava Profilu</IonLabel>
              </IonItem>
              <IonModal
                ref={modal}
                trigger="open-modal"
                onWillPresent={async () => {
                  await fetchUserDocument();
                }}
                className="settings-modal"
              >
                <IonContent fullscreen className="ion-padding">
                  <IonIcon
                    icon={arrowBackOutline}
                    onClick={() => modal.current?.dismiss()}
                    size="large"
                  />
                  <IonItemDivider>
                    <IonLabel>Profil</IonLabel>
                  </IonItemDivider>
                  <IonList
                    className="ion-padding-bottom ion-padding-top input-list"
                    lines="none"
                  >
                    <IonItem>
                      <FormInput
                        label="Křestní jméno"
                        value={firstName}
                        onChange={(e) => setFirstName(e)}
                      />
                    </IonItem>
                    <IonItem>
                      <FormInput
                        label="Příjmení"
                        value={lastName}
                        onChange={(e) => setLastName(e)}
                      />
                    </IonItem>
                    <IonItem>
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
                        label="Telefonní číslo"
                        labelPlacement="floating"
                      ></IonInput>
                    </IonItem>
                  </IonList>
                  <IonItemDivider>
                    <IonLabel>Změna hesla</IonLabel>
                  </IonItemDivider>
                  <IonList
                    className="ion-padding-bottom ion-padding-top input-list"
                    lines="none"
                  >
                    <IonItem>
                      <FormInput
                        label="Nové heslo"
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e)}
                        type="password"
                      />
                    </IonItem>
                    {!!errorMessage && (
                      <IonNote className="ion-padding" color="danger">
                        {errorMessage}
                      </IonNote>
                    )}

                    <IonItem>
                      <FormInput
                        label="Znovu nové heslo"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e)}
                        type="password"
                        disabled={!newPassword}
                      />
                    </IonItem>
                    {!!errorMessageConfirm && (
                      <IonNote className="ion-padding" color="danger">
                        {errorMessageConfirm}
                      </IonNote>
                    )}
                  </IonList>

                  <IonList
                    className="ion-margin-top ion-padding-bottom ion-padding-top input-list"
                    lines="none"
                  >
                    <IonItem>
                      <FormInput
                        label="Stávající heslo"
                        value={oldPassword}
                        onChange={(val) => setOldPassword(val)}
                        type="password"
                      />
                    </IonItem>
                  </IonList>

                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={saveProfile}
                    style={{ marginTop: "20px" }}
                    disabled={
                      !!errorMessageConfirm || !!errorMessage || !oldPassword
                    }
                  >
                    {saveButtonMessage}
                  </IonButton>
                  <IonItemDivider>
                    <IonLabel>Vymazání účtu</IonLabel>
                  </IonItemDivider>
                  <IonList
                    className="ion-no-margin ion-padding-bottom ion-padding-top input-list"
                    lines="none"
                  >
                    <div className="account-delete">
                      <IonText color="danger">
                        Tímto vymažete svůj účet a všechny související data.
                        Tato akce je nevratná.
                      </IonText>
                      <IonInput
                        label="Kontrolní text"
                        value={deleteCheck}
                        onIonInput={(e) => setDeleteCheck(e.detail.value!)}
                        required
                        fill="outline"
                        labelPlacement="floating"
                        type="text"
                      ></IonInput>
                      <IonNote>
                        Pro odemknutí tlačítka napište své&nbsp;
                        <strong>příjmení</strong>
                        &nbsp;do pole výše
                      </IonNote>
                    </div>
                  </IonList>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    id="delete-alert"
                    disabled={deleteCheck !== lastName}
                    style={{ marginTop: "20px" }}
                  >
                    Vymazat účet
                  </IonButton>
                </IonContent>
                <IonAlert
                  trigger="delete-alert"
                  header="Opravdu chcete smazat svůj účet?"
                  buttons={[
                    {
                      text: "Ne",
                      role: "cancel",
                    },
                    {
                      text: "Ano",
                      role: "confirm",
                      handler: (alertData) => {
                        const password = alertData.password;
                        if (!password) {
                          showToast("Heslo je povinné.", 2500);
                          return false;
                        }
                        handleDeleteAccount(password);
                      },
                    },
                  ]}
                  inputs={[
                    {
                      name: "password",
                      placeholder: "Heslo",
                      type: "password",
                    },
                  ]}
                />
              </IonModal>
            </>
          ) : (
            <IonButton
              fill="clear"
              expand="full"
              onClick={() => history.push("/login")}
            >
              Přihlásit se
            </IonButton>
          )}
        </IonList>

        {/* Settings */}
        <IonItemDivider>
          <IonLabel>Nastavení </IonLabel>
        </IonItemDivider>
        <IonList className="input-list">
          <IonItem className="custom-line">
            <IonLabel>Tmavý režim</IonLabel>
            <IonToggle
              checked={isDarkTheme}
              onIonChange={toggleTheme}
              slot="end"
            />
          </IonItem>
          <IonItem>
            <IonLabel>Push notifikace</IonLabel>
            <IonToggle
              checked={pushEnabled}
              slot="end"
              onIonChange={toggleNotifications}
            />
          </IonItem>
          <IonItem
            lines="none"
            button
            onClick={() =>
              (window.location.href = "mailto:esto.contact.team@gmail.com")
            }
          >
            <IonLabel className="ion-text-wrap">
              <h2>Kontaktujte nás</h2>
              <p className="email-note">esto.contact.team@gmail.com</p>
            </IonLabel>
            <IonIcon icon={mailOutline} slot="end" />
          </IonItem>
        </IonList>
        <IonNote className="version-note">Ver. {__APP_VERSION__}</IonNote>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
