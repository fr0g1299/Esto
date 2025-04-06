import { IonChip, IonLabel } from "@ionic/react";

interface Props {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const ToggleChip: React.FC<Props> = ({ label, checked, onToggle }) => (
  <IonChip
    className={checked ? "ion-chip-checked" : "ion-chip-unchecked"}
    onClick={onToggle}
  >
    <IonLabel>{label}</IonLabel>
  </IonChip>
);

export default ToggleChip;
