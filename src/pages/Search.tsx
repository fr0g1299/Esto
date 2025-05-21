import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonRange,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonItemDivider,
} from "@ionic/react";
import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import "../styles/Search.css";
import FormInput from "../components/ui/FormInput";
import ToggleChip from "../components/ui/ToggleChip";
import { hapticsLight, hapticsMedium } from "../services/haptics";

const Search: React.FC = () => {
  const history = useHistory();

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(99999999);

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [radiusString, setRadius] = useState("15");
  const [type, setType] = useState<
    "Vše" | "Byt" | "Apartmán" | "Dům" | "Vila" | "Chata" | "Chalupa"
  >("Vše");
  const [disposition, setDisposition] = useState("Vše");

  const ionInputElMinNumber = useRef<HTMLIonInputElement>(null);
  const ionInputElMaxNumber = useRef<HTMLIonInputElement>(null);

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

  const dispositionOptions = [
    "Vše",
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

  const typeOptions = [
    //TODO: implement in other pages
    "Vše",
    "Byt",
    "Apartmán",
    "Dům",
    "Vila",
    "Chata",
    "Chalupa",
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
    { label: "Balkón", checked: balcony, setter: setBalcony },
    { label: "Bazén", checked: pool, setter: setPool },
    { label: "Zahrada", checked: garden, setter: setGarden },
    { label: "Solární panely", checked: solarPanels, setter: setSolarPanels },
  ];

  const handleSearch = async () => {
    const query = new URLSearchParams();
    await hapticsMedium();

    if (city.trim()) query.append("city", city);
    if (address.trim()) {
      query.append("address", address);
      query.append("radius", radiusString);
    }
    if (type !== "Vše") query.append("type", type);
    if (disposition !== "Vše") query.append("disposition", disposition);
    if (minPrice !== 0) query.append("minPrice", minPrice.toString());
    if (maxPrice !== 0 && maxPrice !== 99999999)
      query.append("maxPrice", maxPrice.toString());

    if (garage) query.append("garage", "true");
    if (elevator) query.append("elevator", "true");
    if (gasConnection) query.append("gasConnection", "true");
    if (threePhaseElectricity) query.append("threePhaseElectricity", "true");
    if (basement) query.append("basement", "true");
    if (furnished) query.append("furnished", "true");
    if (balcony) query.append("balcony", "true");
    if (garden) query.append("garden", "true");
    if (solarPanels) query.append("solarPanels", "true");
    if (pool) query.append("pool", "true");

    console.log("Query params:", query.toString());

    history.push(`/results?${query.toString()}`);
  };

  const onInputPrice = (event: Event, isMinPrice: boolean) => {
    const raw = (event.target as HTMLIonInputElement).value as string;
    console.log("Raw input value:", raw);

    // Remove non-numeric characters and format
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    const capped = digitsOnly.slice(0, 8);
    const formatted = capped.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    const numericValue = parseInt(capped, 10);

    console.log("Formatted value:", formatted);

    if (isMinPrice) {
      const newMinPrice = isNaN(numericValue) ? 0 : numericValue;
      setMinPrice(newMinPrice);
      if (newMinPrice > maxPrice) {
        setMaxPrice(newMinPrice);
      }
      const inputEl = ionInputElMinNumber.current;
      if (inputEl) {
        inputEl.value = formatted;
      }
    } else {
      const newMaxPrice = isNaN(numericValue) ? 0 : numericValue;
      setMaxPrice(newMaxPrice);
      if (newMaxPrice < minPrice) {
        setMinPrice(newMaxPrice);
      }
      const inputEl = ionInputElMaxNumber.current;
      if (inputEl) {
        inputEl.value = formatted;
      }
    }
  };

  return (
    <IonPage className="search-page">
      <IonContent fullscreen className="ion-padding">
        <IonItemDivider>
          <IonLabel>Základní informace</IonLabel>
        </IonItemDivider>
        <IonList lines="full" className="input-list ion-margin-bottom">
          <IonItem lines="none">
            <FormInput label="Adresa" value={address} onChange={setAddress} />
          </IonItem>
          <IonItem lines="none">
            <FormInput
              label="Rádius (km)"
              value={radiusString}
              onChange={setRadius}
              disabled={address.trim() === ""}
              type="number"
              filter={(v) => v.replace(/[^0-9]/g, "")}
            />
          </IonItem>
          <IonItem lines="none">
            <FormInput
              label="Město"
              value={city}
              onChange={setCity}
              filter={(v) => v.replace(/[^a-zA-Z ]/g, "")}
            />
          </IonItem>
        </IonList>

        <IonItemDivider>
          <IonLabel>Typ nemovitosti</IonLabel>
        </IonItemDivider>
        <IonSelect
          interface="popover"
          fill="outline"
          label="Vyberte..."
          labelPlacement="floating"
          className="ion-padding-start ion-padding-end"
          onIonChange={(e) => setType(e.detail.value)}
        >
          {typeOptions.map((type) => (
            <IonSelectOption key={type} value={type}>
              {type}
            </IonSelectOption>
          ))}
        </IonSelect>

        <IonItemDivider>
          <IonLabel>Cena</IonLabel>
        </IonItemDivider>
        <IonList lines="full" className="input-list">
          <IonItem lines="none">
            <IonRange
              dualKnobs
              min={0}
              max={99999999}
              step={1000}
              value={{ lower: minPrice, upper: maxPrice }}
              onIonInput={(e) => {
                const rangeValue = e.detail.value as {
                  lower: number;
                  upper: number;
                };
                setMinPrice(rangeValue.lower);
                setMaxPrice(rangeValue.upper);
              }}
            ></IonRange>
          </IonItem>

          <IonItem lines="none">
            <IonLabel className="ion-margin-end">Od:</IonLabel>
            <IonInput
              type="text"
              fill="outline"
              style={{
                marginRight: "10px",
                fontSize: "clamp(10px, 3.5vw, 16px)",
              }}
              ref={ionInputElMinNumber}
              value={minPrice?.toLocaleString("cs")}
              placeholder="0"
              onIonInput={(e) => onInputPrice(e, true)}
            />
            <IonLabel className="ion-margin-end">Do:</IonLabel>
            <IonInput
              type="text"
              fill="outline"
              style={{ fontSize: "clamp(10px, 3.5vw, 16px)" }}
              ref={ionInputElMaxNumber}
              value={maxPrice?.toLocaleString("cs")}
              placeholder="0"
              onIonInput={(e) => onInputPrice(e, false)}
            />
          </IonItem>
        </IonList>

        <IonItemDivider>
          <IonLabel>Vybavení</IonLabel>
        </IonItemDivider>
        {/* Chips */}
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

        <IonItemDivider className="ion-margin-top">
          <IonLabel>Dispozice</IonLabel>
        </IonItemDivider>

        {/* Disposition selector */}
        <IonSelect
          value={disposition}
          onIonChange={(e) => setDisposition(e.detail.value)}
          interface="action-sheet"
          className="ion-padding-start ion-padding-end ion-margin-bottom"
          fill="outline"
          label="Vyberte..."
          cancelText="Zrušit"
        >
          {dispositionOptions.map((disp) => (
            <IonSelectOption key={disp} value={disp}>
              {disp}
            </IonSelectOption>
          ))}
        </IonSelect>

        {!radiusString && (
          <IonText color="danger" className="ion-padding-start">
            <p>Rádius je povinný, pokud je vyplněna adresa.</p>
          </IonText>
        )}
        <IonButton
          color="primary"
          expand="block"
          onClick={handleSearch}
          disabled={!radiusString}
        >
          Hledat
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Search;
