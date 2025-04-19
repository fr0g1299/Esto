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
  IonToast,
  IonAlert,
  IonList,
  IonSelect,
  IonSelectOption,
  IonAccordionGroup,
  IonAccordion,
  IonCheckbox,
  IonRow,
  IonCol,
  IonDatetime,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { getPropertyById, updateProperty } from "../services/propertyService";
import FormInput from "../components/ui/FormInput";
import { useTabBarScrollEffect } from "../hooks/useTabBarScrollEffect";
import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import ImageUploader from "../components/ui/ImageUploader";
import StepperInput from "../components/ui/StepperInput";
import ToggleChip from "../components/ui/ToggleChip";
import { useMaskito } from "@maskito/react";

import "../styles/CreateAndEdit.css";

interface RouteParams {
  id: string;
}

interface UploadedImage {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

type ImageType = File | UploadedImage;

const EditProperty: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  useTabBarScrollEffect();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(false);

  // States for property details, that can be filtered
  const [title, setTitle] = useState("");
  const [priceString, setPrice] = useState("");
  const price = Number(priceString || "0");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<
    "Byt" | "Apartmán" | "Dům" | "Vila" | "Chata" | "Chalupa"
  >("Byt");
  const [disposition, setDisposition] = useState("3+1");

  // States for chips
  const [garage, setGarage] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [gasConnection, setGasConnection] = useState(false);
  const [threePhaseElectricity, setThreePhaseElectricity] = useState(false);
  const [basement, setBasement] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [balcony, setBalcony] = useState(false);
  const [garden, setGarden] = useState(false);
  const [solarPanels, setSolarPanels] = useState(false);
  const [pool, setPool] = useState(false);

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
      min: 1,
    },
    {
      label: "Počet parkovacích míst",
      value: parkingSpots,
      onChange: setParkingSpots,
      min: 0,
    },
  ];

  const chipOptions: {
    label: string;
    checked: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
  }[] = [
    { label: "Garáž", checked: garage, setter: setGarage },
    { label: "Výtah", checked: elevator, setter: setElevator },
    {
      label: "Plynové připojení",
      checked: gasConnection,
      setter: setGasConnection,
    },
    {
      label: "Třífázová elektřina",
      checked: threePhaseElectricity,
      setter: setThreePhaseElectricity,
    },
    { label: "Sklep", checked: basement, setter: setBasement },
    { label: "Zařízený", checked: furnished, setter: setFurnished },
    { label: "Balkon", checked: balcony, setter: setBalcony },
    { label: "Bazén", checked: pool, setter: setPool },
    { label: "Zahrada", checked: garden, setter: setGarden },
    { label: "Solární panely", checked: solarPanels, setter: setSolarPanels },
  ];

  const dispositionOptions = [
    "1+kk",
    "1+1",
    "2+kk",
    "2+1",
    "3+kk",
    "3+1",
    "4+kk",
    "4+1",
    "5+kk",
    "5+1",
    "6+kk",
    "6+1",
    "7+kk",
    "7+1",
    "Atypický",
  ];

  const kitchenEquipmentOptions = [
    "Lednice",
    "Sporák",
    "Mikrovlnná trouba",
    "Trouba",
    "Myčka",
    "Mrazák",
    "Kuchyňské náčiní",
    "Hrnce a pánve",
    "Kávovar",
    "Topinkovač",
    "Rychlovarná konvice",
    "Mixér",
  ];

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const data = await getPropertyById(id);
        setTitle(data.title);
        setPrice(data.price.toString());
        setAddress(data.address);
        setCity(data.city);
        setType(data.type);
        setDisposition(data.disposition);
        setGarage(data.garage);
        setElevator(data.elevator);
        setGasConnection(data.gasConnection);
        setThreePhaseElectricity(data.threePhaseElectricity);
        setBasement(data.basement);
        setFurnished(data.furnished);
        setBalcony(data.balcony);
        setGarden(data.garden);
        setSolarPanels(data.solarPanels);
        setPool(data.pool);
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
        setImages(data.images as UploadedImage[]); // Set images if available
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const handleSave = async () => {
    await updateProperty(
      id,
      {
        title,
        price,
        address,
        city,
        type,
        disposition,
        garage,
        elevator,
        gasConnection,
        threePhaseElectricity,
        basement,
        furnished,
        balcony,
        garden,
        solarPanels,
        pool,
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
    setToast(true);
    setTimeout(() => history.push(`/details/${id}`), 1500);
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
        ) : (
          <>
            <IonList lines="full" className="input-list">
              <FormInput
                label="Název inzerátu"
                value={title}
                onChange={setTitle}
              />
              <FormInput
                label="Cena (Kč)"
                value={priceString}
                onChange={setPrice}
                type="number"
              />
              <FormInput label="Adresa" value={address} onChange={setAddress} />

              <FormInput label="Město" value={city} onChange={setCity} />
              <IonSelect
                interface="popover"
                fill="outline"
                value={type}
                label="Typ nemovitosti"
                labelPlacement="floating"
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
            </IonList>

            {/* Chips */}
            {chipOptions.map(({ label, checked, setter }) => (
              <ToggleChip
                key={label}
                label={label}
                checked={checked}
                onToggle={() => setter(!checked)}
              />
            ))}

            {/* Disposition selector */}
            <IonList lines="full" className="input-list">
              <IonSelect
                value={disposition}
                onIonChange={(e) => setDisposition(e.detail.value)}
                interface="action-sheet"
                fill="outline"
                label="Dispozice"
              >
                {dispositionOptions.map((disp) => (
                  <IonSelectOption key={disp} value={disp}>
                    {disp}
                  </IonSelectOption>
                ))}
              </IonSelect>

              {/* Stepper inputs */}
              {stepperInputs.map(({ label, value, onChange, min }) => (
                <StepperInput
                  key={label}
                  label={label}
                  value={value}
                  onChange={onChange}
                  min={min}
                />
              ))}
            </IonList>

            {/* Year picker */}
            <IonRow className="ion-padding-start ion-align-items-center">
              <IonCol size="auto" className="ion-padding-start">
                <IonLabel>Rok výstavby</IonLabel>
              </IonCol>
              <IonCol className="ion-padding-end">
                <IonDatetime
                  presentation="year"
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
              </IonCol>
            </IonRow>

            {/* More Inputs */}
            <IonList lines="full" className="input-list">
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
              ></IonInput>
              <FormInput
                label="Popis"
                value={description}
                onChange={setDescription}
              />
              <FormInput
                label="Typ vytápění"
                value={heatingType}
                onChange={setHeatingType}
              />
              <FormInput
                label="Velikost zahrady (m²)"
                value={gardenSizeString}
                onChange={setGardenSize}
                type="number"
                disabled={!garden}
              />
              <FormInput
                label="Velikost pozemku (m²)"
                value={propertySizeString}
                onChange={setPropertySize}
                type="number"
              />
            </IonList>

            {/* Kitchen Equipment */}
            <IonAccordionGroup
              multiple
              expand="inset"
              className="accordion-group"
            >
              <IonAccordion value="interiorDetails">
                <IonItem slot="header" color="light">
                  <IonLabel>Vybavení kuchyně</IonLabel>
                </IonItem>
                <IonList slot="content">
                  {kitchenEquipmentOptions.map((item) => (
                    <IonItem key={item}>
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

            <IonItem lines="none">
              <IonLabel>Nahrát obrázky (min 3, max 20)</IonLabel>
            </IonItem>

            <ImageUploader
              images={images}
              setImages={setImages}
              max={20}
              onRemoveUploadedImage={handleRemoveUploadedImage}
            />
            <IonButton id="save-alert" expand="block">
              Uložit změny
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
                  handler: () => {
                    console.log("Cancel clicked");
                  },
                },
                {
                  text: "Ano",
                  handler: () => {
                    handleSave();
                  },
                },
              ]}
            ></IonAlert>
          </>
        )}
        <IonToast isOpen={toast} message="Uloženo!" duration={1500} />
      </IonContent>
    </IonPage>
  );
};

export default EditProperty;
