import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading,
  IonAlert,
  IonList,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  IonCheckbox,
  IonDatetime,
  IonButtons,
  IonBackButton,
  useIonToast,
  IonIcon,
  IonText,
  IonItemDivider,
  IonNote,
  IonTextarea,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { useStorage } from "../hooks/useStorage";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { getPropertyById, updateProperty } from "../services/propertyService";
import { geocodeAddress } from "../services/geocodingService";
import { hapticsHeavy, hapticsLight, hapticsMedium } from "../services/haptics";
import {
  UploadedImage,
  PropertyRouteParams,
  ImageType,
} from "../types/interfaces";
import {
  dispositionOptions,
  kitchenEquipmentOptions,
} from "../constants/options";

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

import FormInput from "../components/ui/FormInput";
import ImageUploader from "../components/ui/ImageUploader";
import StepperInput from "../components/ui/StepperInput";
import ToggleChip from "../components/ui/ToggleChip";

import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import { useMaskito } from "@maskito/react";
import { homeOutline, lockClosedOutline } from "ionicons/icons";
import "../styles/CreateAndEdit.css";
import { useChipOptions } from "../hooks/useChipOptions";

const EditProperty: React.FC = () => {
  const { user } = useAuth();
  const { get, set } = useStorage();
  const [showToast] = useIonToast();
  useTabBarScrollEffect();
  const removeProperty = httpsCallable(functions, "removeProperty");

  // States for chips
  const chipOptions = useChipOptions();

  const [ownerId, setOwnerId] = useState("");
  const { propertyId } = useParams<PropertyRouteParams>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<string>("");

  // States for property details, that can be filtered
  const [title, setTitle] = useState("");
  const [priceString, setPrice] = useState("");
  const price = Number(priceString || "0");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<
    "Byt" | "Apartmán" | "Dům" | "Vila" | "Chata" | "Chalupa" | ""
  >("");
  const [disposition, setDisposition] = useState("");

  // States for property details, that are not filtered
  const [yearBuilt, setYearBuilt] = useState(0);
  const [floors, setFloors] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [gardenSizeString, setGardenSize] = useState("");
  const gardenSize = Number(gardenSizeString || "0");
  const [propertySizeString, setPropertySize] = useState("");
  const propertySize = Number(propertySizeString || "0");
  const [parkingSpots, setParkingSpots] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [description, setDescription] = useState("");
  const [kitchenEquipment, setKitchenEquipment] = useState<string[]>([]);
  const [heatingType, setHeatingType] = useState("");
  const [availability, setAvailability] = useState(true);

  // State for image upload
  const [images, setImages] = useState<ImageType[]>([]);
  const [removedUploadedImages, setRemovedUploadedImages] = useState<
    UploadedImage[]
  >([]);

  const handleRemoveUploadedImage = (image: UploadedImage) => {
    setRemovedUploadedImages((prev) => [...prev, image]);
  };

  // Maskito for postal code
  const postalCodeMaskOptions: MaskitoOptions = {
    mask: [/\d/, /\d/, /\d/, " ", /\d/, /\d/],
  };
  const postalCodeMask = useMaskito({
    options: postalCodeMaskOptions,
  });
  const [postalCode, setPostalCode] = useState(
    maskitoTransform("", postalCodeMaskOptions)
  );

  const stepperInputs: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
  }[] = [
    { label: "Počet podlaží", value: floors, onChange: setFloors, min: 1 },
    { label: "Počet pokojů", value: rooms, onChange: setRooms, min: 1 },
    {
      label: "Počet koupelen",
      value: bathroomCount,
      onChange: setBathroomCount,
      min: 0,
    },
    {
      label: "Počet parkovacích míst",
      value: parkingSpots,
      onChange: setParkingSpots,
      min: 0,
    },
  ];


  useEffect(() => {
    setLoading(true);
    console.log("Loading property with ID:", propertyId);

    const loadProperty = async () => {
      try {
        const data = await getPropertyById(propertyId);
        setOwnerId(data.ownerId);
        setTitle(data.title);
        setPrice(data.price.toString());
        setAddress(data.address);
        setCity(data.city);
        setType(data.type);
        setDisposition(data.disposition);
        chipOptions[0].setter(data.garage);
        chipOptions[1].setter(data.elevator);
        chipOptions[2].setter(data.gasConnection);
        chipOptions[3].setter(data.threePhaseElectricity);
        chipOptions[4].setter(data.basement);
        chipOptions[5].setter(data.furnished);
        chipOptions[6].setter(data.balcony);
        chipOptions[7].setter(data.garden);
        chipOptions[8].setter(data.solarPanels);
        chipOptions[9].setter(data.pool);
        setYearBuilt(data.yearBuilt);
        setFloors(data.floors);
        setRooms(data.rooms);
        setBathroomCount(data.bathroomCount);
        setParkingSpots(data.parkingSpots);
        setGardenSize(data.gardenSize.toString());
        setPropertySize(data.propertySize.toString());
        setDescription(data.description);
        setKitchenEquipment(data.kitchenEquipment);
        setHeatingType(data.heatingType);
        setPostalCode(data.postalCode);
        setAvailability(data.status === "Available");
        setImages(
          (data.images as UploadedImage[]).sort(
            (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
          )
        ); // Set and sort images by sortOrder if available
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
    // eslint-disable-next-line
  }, [propertyId]);

  const handleSave = async () => {
    if (!user) return;

    if (!chipOptions[8].checked) {
      setGardenSize("");
    }
    if (type === "") {
      showToast("Musíte vybrat typ nemovitosti.", 2500);
      return;
    }
    if (price > 99999999) {
      showToast("Cena nemůže být větší než 99 999 999 Kč.", 2500);
      return;
    }
    if (description.length < 20) {
      showToast("Popis musí být delší.", 2500);
      return;
    }

    try {
      setLoadingButton(true);
      const { latitude, longitude } = await geocodeAddress(address);

      await updateProperty(
        propertyId,
        {
          title,
          price,
          address,
          city,
          type,
          disposition,
          geolocation: { latitude, longitude },
          garage: chipOptions[0].checked,
          elevator: chipOptions[1].checked,
          gasConnection: chipOptions[2].checked,
          threePhaseElectricity: chipOptions[3].checked,
          basement: chipOptions[4].checked,
          furnished: chipOptions[5].checked,
          balcony: chipOptions[6].checked,
          garden: chipOptions[7].checked,
          solarPanels: chipOptions[8].checked,
          pool: chipOptions[9].checked,
          status: availability ? "Available" : "Sold",
        },
        {
          yearBuilt,
          floors,
          bathroomCount,
          gardenSize,
          propertySize,
          parkingSpots,
          rooms,
          description,
          kitchenEquipment,
          heatingType,
          postalCode,
        },
        images.filter((image): image is File => image instanceof File),
        images.filter(
          (image): image is UploadedImage => !(image instanceof File)
        ),
        removedUploadedImages
      );

      await hapticsMedium();
      setLoadingButton(false);
      showToast("Inzerát byl úspěšně upraven!", 1500);
      setTimeout(() => history.push(`/details/${propertyId}`), 500);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Address not found") {
          await hapticsHeavy();
          setLoadingButton(false);
          showToast("Adresa nebyla nalezena.", 2500);
        } else {
          await hapticsHeavy();
          setLoadingButton(false);
          showToast(error.message, 2500);
        }
      }
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setLoadingButton(true);

    try {
      const result = await removeProperty({ propertyId });
      console.log("Property deleted:", result.data);
    } catch (error) {
      setLoadingButton(false);
      console.error("Error deleting property:", error);
    }

    const viewedHistory: { id: string }[] = (await get("viewedHistory")) || [];

    const updatedHistory = viewedHistory.filter(
      (p: { id: string }) => p.id !== propertyId
    );

    console.log("Updated history after removal:", updatedHistory);

    await set("viewedHistory", updatedHistory);

    await hapticsHeavy();
    setLoadingButton(false);
    showToast("Inzerát byl úspěšně smazán!", 3000);
    setTimeout(() => history.replace("/"), 500);
  };

  return (
    <IonPage className="edit-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton></IonBackButton>
          </IonButtons>
          <IonTitle>Upravit inzerát</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <IonLoading isOpen message="Načítání..." />
        ) : user?.uid != ownerId ? (
          <div className="empty-state">
            <IonIcon icon={lockClosedOutline} size="large" color="medium" />
            <h2>Přístup odepřen</h2>
            <IonText color="medium">
              <p>
                Nemáte oprávnění upravovat tento inzerát, protože nejste jeho
                vlastníkem.
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
        ) : (
          <>
            <IonItemDivider>
              <IonLabel>Základní informace</IonLabel>
            </IonItemDivider>
            <IonList lines="full" className="input-list">
              <IonItem lines="none">
                <FormInput
                  label="Název inzerátu"
                  value={title}
                  onChange={setTitle}
                  spellCheck
                  autoCorrect="on"
                  maxlen={100}
                  count
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput
                  label="Cena (Kč)"
                  value={priceString}
                  onChange={setPrice}
                  type="number"
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput
                  label="Adresa"
                  value={address}
                  onChange={setAddress}
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput label="Město" value={city} onChange={setCity} />
              </IonItem>
            </IonList>

            <IonItemDivider>
              <IonLabel>Typ nemovitosti</IonLabel>
            </IonItemDivider>
            <IonSelect
              interface="popover"
              fill="outline"
              value={type}
              label={type === "" ? "Vyberte..." : undefined}
              className="ion-padding-start ion-padding-end"
              onIonChange={(e) => setType(e.detail.value)}
            >
              {["Byt", "Apartmán", "Dům", "Vila", "Chata", "Chalupa"].map(
                (type) => (
                  <IonSelectOption key={type} value={type}>
                    {type}
                  </IonSelectOption>
                )
              )}
            </IonSelect>

            {/* Chips */}
            <IonItemDivider>
              <IonLabel>Vybavení</IonLabel>
            </IonItemDivider>
            <div className="chip-container">
              {chipOptions.map(({ label, checked, setter }) => (
                <ToggleChip
                  key={label}
                  label={label}
                  checked={checked}
                  onToggle={() => {
                    hapticsLight();
                    setter(!checked);
                  }}
                />
              ))}
            </div>

            {/* Disposition selector */}
            <IonItemDivider>
              <IonLabel>Dispozice</IonLabel>
            </IonItemDivider>
            <IonSelect
              value={disposition}
              onIonChange={(e) => setDisposition(e.detail.value)}
              interface="action-sheet"
              fill="outline"
              className="ion-padding-start ion-padding-end"
              label={disposition === "" ? "Vyberte..." : undefined}
              cancelText="Zrušit"
            >
              {dispositionOptions.map((disp) => (
                <IonSelectOption key={disp} value={disp}>
                  {disp}
                </IonSelectOption>
              ))}
            </IonSelect>

            {/* Stepper inputs */}
            <IonItemDivider>
              <IonLabel>Vnitřní uspořádání</IonLabel>
            </IonItemDivider>
            <IonList lines="full" className="input-list">
              {stepperInputs.map(({ label, value, onChange, min }) => (
                <IonItem key={label} lines="none">
                  <StepperInput
                    key={label}
                    label={label}
                    value={value}
                    onChange={onChange}
                    min={min}
                  />
                </IonItem>
              ))}
            </IonList>

            {/* Year picker */}
            <IonItemDivider>
              <IonLabel>Rok výstavby</IonLabel>
            </IonItemDivider>
            <IonDatetime
              presentation="year"
              min="1600"
              value={yearBuilt.toString()}
              onIonChange={(e) => {
                const date = new Date(
                  Array.isArray(e.detail.value)
                    ? e.detail.value[0]
                    : e.detail.value!
                );
                setYearBuilt(date.getFullYear());
              }}
            />

            <IonItemDivider>
              <IonLabel>Popis</IonLabel>
            </IonItemDivider>
            <div className="textarea-container">
              <IonTextarea
                color="primary"
                placeholder="Popis nemovitosti"
                counter
                maxlength={3500}
                value={description}
                onIonInput={(e) => setDescription(e.detail.value!.trim())}
                autoGrow
                spellcheck
                autoCorrect="on"
                rows={1}
                inputMode="text"
              ></IonTextarea>
            </div>

            {/* More Inputs */}
            <IonItemDivider>
              <IonLabel>Detailní informace</IonLabel>
            </IonItemDivider>
            <IonList lines="full" className="input-list">
              <IonItem lines="none">
                <IonInput
                  ref={(postalCode) => {
                    if (postalCode) {
                      postalCode.getInputElement().then((input) => {
                        postalCodeMask(input);
                      });
                    }
                  }}
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  placeholder="000 00"
                  onIonInput={(e) => setPostalCode(e.detail.value!)}
                  required
                  fill="solid"
                  label="PSČ"
                  labelPlacement="floating"
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput
                  label="Typ vytápění"
                  value={heatingType}
                  onChange={setHeatingType}
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput
                  label="Velikost zahrady (m²)"
                  value={gardenSizeString}
                  onChange={setGardenSize}
                  type="number"
                  disabled={!chipOptions[8].checked}
                />
              </IonItem>
              <IonItem lines="none">
                <FormInput
                  label="Velikost pozemku (m²)"
                  value={propertySizeString}
                  onChange={setPropertySize}
                  type="number"
                />
              </IonItem>
            </IonList>

            {/* Kitchen Equipment */}
            <IonAccordionGroup
              multiple
              expand="inset"
              className="accordion-group ion-no-margin"
            >
              <IonAccordion value="interiorDetails">
                <IonItem slot="header" color="light">
                  <IonLabel>Vybavení kuchyně</IonLabel>
                </IonItem>
                <IonList slot="content">
                  {kitchenEquipmentOptions.map((item, index) => (
                    <IonItem
                      key={item}
                      lines={
                        index === kitchenEquipmentOptions.length - 1
                          ? "none"
                          : undefined
                      }
                    >
                      <IonCheckbox
                        slot="start"
                        checked={kitchenEquipment.includes(item)}
                        onIonChange={(e) => {
                          if (e.detail.checked) {
                            setKitchenEquipment((prev) => [...prev, item]);
                          } else {
                            setKitchenEquipment((prev) =>
                              prev.filter((i) => i !== item)
                            );
                          }
                        }}
                      />
                      <IonLabel>{item}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonAccordion>
            </IonAccordionGroup>

            <IonItemDivider>
              <IonLabel>Nahrání obrázků</IonLabel>
              <IonNote slot="end">Minimálně 3, maximálně 20 obrázků</IonNote>
            </IonItemDivider>
            <ImageUploader
              images={images}
              setImages={setImages}
              max={20}
              onRemoveUploadedImage={handleRemoveUploadedImage}
            />

            <IonList className="input-list ion-margin-top ion-margin-bottom">
              <IonItem lines="none">
                <IonCheckbox
                  checked={availability}
                  style={{ "--size": "20px" }}
                  helperText="Zaškrtněte, pokud je nemovitost dostupná, odškrtněte, pokud je prodaná/zamluvená"
                  onIonChange={(e) => {
                    hapticsLight();
                    setAvailability(e.detail.checked);
                  }}
                >
                  <strong>Stav:</strong>
                </IonCheckbox>
              </IonItem>
            </IonList>

            <IonButton
              id="save-alert"
              expand="block"
              className="ion-margin-bottom"
              disabled={
                images.length < 3 ||
                !title ||
                !price ||
                !address ||
                !type ||
                !disposition
              }
            >
              Uložit změny
            </IonButton>
            {(images.length < 3 ||
              !title ||
              !price ||
              !address ||
              !type ||
              !disposition) && (
              <IonNote color="danger">
                <strong>
                  Musíte mít alespoň 3 obrázky a vyplnit všechny povinné údaje:
                  Název inzerátu, Cena, Adresa, Typ nemovitosti, Dispozice
                </strong>
              </IonNote>
            )}
            <IonItemDivider>
              <IonLabel>Vymazání inzerátu</IonLabel>
            </IonItemDivider>
            <IonList
              className="ion-no-margin ion-padding-bottom ion-padding-top input-list"
              lines="none"
            >
              <div className="account-delete">
                <IonText color="danger">
                  Tímto vymažete tento inzerát a všechny související data. Tato
                  akce je nevratná.
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
                  Pro odemknutí tlačítka napište&nbsp;
                  <strong>souhlasím</strong>
                  &nbsp;do pole výše
                </IonNote>
              </div>
            </IonList>
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              id="delete-alert"
              disabled={deleteCheck.toUpperCase().trim() !== "SOUHLASÍM"}
              style={{ marginTop: "20px" }}
            >
              Vymazat inzerát
            </IonButton>
            <IonAlert
              trigger="save-alert"
              header="Opravdu chcete provést změny?"
              message="Pokud změníte inzerát, budou provedeny změny."
              buttons={[
                {
                  text: "Zrušit",
                  role: "cancel",
                  cssClass: "secondary",
                },
                {
                  text: "Ano",
                  handler: () => {
                    handleSave();
                  },
                },
              ]}
            ></IonAlert>
            <IonAlert
              trigger="delete-alert"
              header="Opravdu chcete smazat inzerát?"
              message="Pokud smažete inzerát, nebude možné ho obnovit."
              buttons={[
                {
                  text: "Zrušit",
                  role: "cancel",
                  cssClass: "secondary",
                },
                {
                  text: "Ano",
                  handler: () => {
                    handleRemove();
                  },
                },
              ]}
            ></IonAlert>
          </>
        )}
      </IonContent>
      <IonLoading
        isOpen={loadingButton}
        message="Zpracovávám..."
        spinner="crescent"
      />
    </IonPage>
  );
};

export default EditProperty;
