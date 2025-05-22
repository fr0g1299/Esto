import React from "react";
import {
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons,
  IonText,
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
    <IonItem lines="none">
      <IonLabel>{label}</IonLabel>
      <IonButtons className="stepper-buttons" slot="end">
        <IonButton
          className="stepper-button"
          onClick={decrement}
          disabled={value <= min}
        >
          <IonIcon icon={removeOutline} />
        </IonButton>
        <IonText className="ion-margin-start ion-margin-end">{value}</IonText>
        <IonButton
          className="stepper-button"
          onClick={increment}
          disabled={value >= max}
        >
          <IonIcon icon={addOutline} />
        </IonButton>
      </IonButtons>
    </IonItem>
  );
};

export default StepperInput;
