import { IonInput } from "@ionic/react";
import { useRef } from "react";

interface Props<T extends string | number> {
  label: string;
  value?: T;
  type?: "text" | "number";
  onChange: (val: T) => void;
  disabled?: boolean;
  filter?: (value: string) => string; // For future use
  // filter={(value) => value.replace(/[^a-zA-Z]/g, "")}
}

function FormInput<T extends string | number>({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  filter,
}: Props<T>) {
  const ionInputEl = useRef<HTMLIonInputElement>(null);

  const handleInput = (event: Event) => {
    let inputValue = (event.target as HTMLIonInputElement).value || "";

    if (filter) {
      inputValue = filter(String(inputValue));
    }

    onChange(type === "number" ? (Number(inputValue) as T) : (inputValue as T));

    const inputCmp = ionInputEl.current;
    if (inputCmp) {
      inputCmp.value = inputValue;
    }
  };

  return (
    <IonInput
      value={value}
      type={type}
      fill="solid"
      label={label}
      labelPlacement="floating"
      disabled={disabled}
      ref={ionInputEl}
      onIonInput={handleInput}
    />
  );
}

export default FormInput;
