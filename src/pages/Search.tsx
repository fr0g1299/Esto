import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonRange,
  IonChip,
} from "@ionic/react";
import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import "../styles/Search.css";

const Search: React.FC = () => {
  const history = useHistory();

  const [balcony, setBalcony] = useState(false);
  const [garden, setGarden] = useState(false);
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(99999999);

  const ionInputEl = useRef<HTMLIonInputElement>(null);
  const ionInputElMinNumber = useRef<HTMLIonInputElement>(null);
  const ionInputElMaxNumber = useRef<HTMLIonInputElement>(null);

  const handleSearch = () => {
    console.log("Search clicked", {
      balcony,
      garden,
      city,
      minPrice,
      maxPrice,
    });
    const query = new URLSearchParams();

    if (balcony) query.append("balcony", "true");
    if (garden) query.append("garden", "true");
    if (city.trim()) query.append("city", city);
    if (minPrice !== 0) query.append("minPrice", minPrice.toString());
    if (maxPrice !== 0 && maxPrice !== 99999999)
      query.append("maxPrice", maxPrice.toString());

    console.log("Query params:", query.toString());

    history.push(`/results?${query.toString()}`);
  };

  const onInputCity = (event: Event) => {
    const value = (event.target as HTMLIonInputElement).value as string;

    const filteredValue = value.replace(/[^a-zA-Z]+/g, "");

    setCity(filteredValue);

    const inputCmp = ionInputEl.current;
    if (inputCmp !== null) {
      inputCmp.value = filteredValue;
    }
  };

  const onInputPrice = (event: Event, isMinPrice: boolean) => {
    const raw = (event.target as HTMLIonInputElement).value as string;
    console.log("Raw input value:", raw);

    // Remove non-numeric characters and format
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    const capped = digitsOnly.slice(0, 8);
    const formatted = capped.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Vyhledávaní</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonItem>
          <IonInput
            labelPlacement="stacked"
            label="City"
            value={city}
            onIonInput={onInputCity}
            ref={ionInputEl}
          ></IonInput>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            Cena: (<strong>{minPrice?.toLocaleString() || "0"}</strong>) - (
            <strong>{maxPrice?.toLocaleString() || "0"}</strong>)
          </IonLabel>
        </IonItem>

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

        <IonItem>
          <IonLabel className="ion-margin-end">Od:</IonLabel>
          <IonInput
            type="text"
            ref={ionInputElMinNumber}
            value={minPrice?.toLocaleString()}
            placeholder="0"
            onIonInput={(e) => onInputPrice(e, true)}
          />
          <IonLabel className="ion-margin-end">Do:</IonLabel>
          <IonInput
            type="text"
            ref={ionInputElMaxNumber}
            value={maxPrice?.toLocaleString()}
            placeholder="0"
            onIonInput={(e) => onInputPrice(e, false)}
          />
        </IonItem>

        <IonItem>
          <IonChip
            className={balcony ? "ion-chip-checked" : "ion-chip-unchecked"}
            onClick={() => setBalcony(!balcony)}
          >
            <IonLabel>Balkón</IonLabel>
          </IonChip>

          <IonChip
            className={garden ? "ion-chip-checked" : "ion-chip-unchecked"}
            onClick={() => setGarden(!garden)}
          >
            <IonLabel>Zahrada</IonLabel>
          </IonChip>
        </IonItem>

        <IonButton color="primary" expand="block" onClick={handleSearch}>
          Hledat
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Search;
