import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import {
  IonPage,
  IonContent,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonDatetime,
  IonItem,
  IonCheckbox,
  IonList,
  IonAccordionGroup,
  IonAccordion,
  IonInput,
  useIonToast,
  IonItemDivider,
  IonNote,
  IonAlert,
  IonTextarea,
  IonLoading,
  useIonViewWillEnter,
} from "@ionic/react";
import { useAuth } from "../hooks/useAuth";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { createProperty } from "../services/propertyService";
import { geocodeAddress } from "../services/geocodingService";
import { hapticsHeavy, hapticsLight, hapticsMedium } from "../services/haptics";
import { UploadedImage } from "../types/interfaces";
import {
  dispositionOptions,
  kitchenEquipmentOptions,
} from "../constants/options";

import StepperInput from "../components/ui/StepperInput";
import FormInput from "../components/ui/FormInput";
import ToggleChip from "../components/ui/ToggleChip";
import ImageUploader from "../components/ui/ImageUploader";

import { MaskitoOptions } from "@maskito/core";
import { useMaskito } from "@maskito/react";
import { maskitoTransform } from "@maskito/core";
import "../styles/CreateAndEdit.css";
import { useChipOptions } from "../hooks/useChipOptions";

type ImageType = File | UploadedImage;

const Create: React.FC = () => {
  const { user } = useAuth();
  const [showToast] = useIonToast();
  const history = useHistory();
  useTabBarScrollEffect();
  const [loading, setLoading] = useState(false);

  // States for chips
  const chipOptions = useChipOptions();

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

  // State for image upload
  const [images, setImages] = useState<ImageType[]>([]);

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
    console.log("images create", images);
  }, [images]);

  const handleCreate = async () => {
    if (!user) return;

    if (images.length < 3) {
      showToast("Musíte vybrat alespoň 3 obrázky.", 2500);
      return;
    }
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
      setLoading(true);
      const { latitude, longitude } = await geocodeAddress(address);

      const propertyId = await createProperty(
        {
          ownerId: user.uid,
          title,
          price,
          status: "Available",
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
        },
        {
          yearBuilt,
          floors,
          bathroomCount,
          gardenSize,
          propertySize,
          parkingSpots,
          rooms,
          postalCode,
          description,
          kitchenEquipment,
          heatingType,
        },
        images.filter((image): image is File => image instanceof File)
      );

      await hapticsMedium();
      setLoading(false);
      showToast("Inzerát byl úspěšně vytvořen!", 1500);
      setTimeout(() => history.push(`/details/${propertyId}`), 500);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Address not found") {
          await hapticsHeavy();
          setLoading(false);
          showToast("Adresa nebyla nalezena.", 2500);
        } else {
          await hapticsHeavy();
          setLoading(false);
          showToast(error.message, 2500);
        }
      }
    }
  };

  useIonViewWillEnter(() => {
    setTitle("");
    setPrice("");
    setAddress("");
    setCity("");
    setType("");
    setDisposition("");
    chipOptions.forEach((option) => option.setter(false));
    setYearBuilt(0);
    setFloors(1);
    setBathroomCount(1);
    setGardenSize("");
    setPropertySize("");
    setParkingSpots(0);
    setRooms(1);
    setDescription("");
    setKitchenEquipment([]);
    setHeatingType("");
    setPostalCode("");
    setImages([]);
  });

  return (
    <IonPage className="create-page">
      <IonContent fullscreen className="ion-padding" scrollEvents>
        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          id="trigger-reset"
        >
          Resetovat formulář
        </IonButton>
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
            <FormInput label="Adresa" value={address} onChange={setAddress} />
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
          value={type}
          fill="outline"
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

        <ImageUploader images={images} setImages={setImages} max={20} />

        <IonButton
          expand="block"
          className="ion-margin-bottom"
          onClick={handleCreate}
          disabled={
            images.length < 3 ||
            !title ||
            !price ||
            !address ||
            !type ||
            !disposition
          }
        >
          Vytvořit inzerát
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
        <IonAlert
          trigger="trigger-reset"
          header="Opravdu chcete vyresetovat formulář?"
          buttons={[
            {
              text: "Zrušit",
              role: "cancel",
              cssClass: "secondary",
            },
            {
              text: "Ano",
              handler: () => {
                setTitle("");
                setPrice("");
                setAddress("");
                setCity("");
                setType("");
                setDisposition("");
                chipOptions.forEach((option) => option.setter(false));
                // setGarage(false);
                // setElevator(false);
                // setGasConnection(false);
                // setThreePhaseElectricity(false);
                // setBasement(false);
                // setFurnished(false);
                // setBalcony(false);
                // setGarden(false);
                // setSolarPanels(false);
                // setPool(false);
                setYearBuilt(0);
                setFloors(1);
                setBathroomCount(1);
                setGardenSize("");
                setPropertySize("");
                setParkingSpots(0);
                setRooms(1);
                setDescription("");
                setKitchenEquipment([]);
                setHeatingType("");
                setPostalCode("");
                setImages([]);
              },
            },
          ]}
        ></IonAlert>
      </IonContent>
      <IonLoading
        isOpen={loading}
        message="Vytváření probíhá..."
        spinner="crescent"
      />
    </IonPage>
  );
};

export default Create;
