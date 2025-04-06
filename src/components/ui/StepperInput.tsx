import React from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
} from "@ionic/react";
import { addOutline, removeOutline } from "ionicons/icons";

interface StepperInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max?: number;
  step?: number;
}

const StepperInput: React.FC<StepperInputProps> = ({
  label,
  value,
  onChange,
  min,
  max = 15,
  step = 1,
}) => {
  const increment = () => onChange(Math.min(value + step, max));
  const decrement = () => onChange(Math.max(value - step, min));

  return (
    <IonItem>
      <IonLabel>{label}</IonLabel>
      <IonButtons slot="end">
        <IonButton onClick={decrement}>
          <IonIcon icon={removeOutline} />
        </IonButton>
        <IonInput
          type="number"
          value={value}
          onIonInput={(e) =>
            onChange(
              Math.min(Math.max(parseInt(e.detail.value!, 10) || min, min), max)
            )
          }
          style={{ textAlign: "center", width: "60px" }}
        />
        <IonButton onClick={increment}>
          <IonIcon icon={addOutline} />
        </IonButton>
      </IonButtons>
    </IonItem>
  );
};

export default StepperInput;
