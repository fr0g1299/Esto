import { useRef } from "react";
import { IonInput, IonInputPasswordToggle } from "@ionic/react";

interface Props<T extends string | number> {
  label: string;
  value?: T;
  fill?: "solid" | "outline";
  type?: "text" | "number" | "password";
  spellCheck?: boolean;
  autoCorrect?: "on" | "off";
  onChange: (val: T) => void;
  disabled?: boolean;
  filter?: (value: string) => string;
  maxlen?: number;
  count?: boolean;
  // filter={(value) => value.replace(/[^a-zA-Z]/g, "")}
}

function FormInput<T extends string | number>({
  label,
  value,
  onChange,
  fill = "solid",
  type = "text",
  spellCheck = false,
  autoCorrect = "off",
  disabled,
  filter,
  maxlen = undefined,
  count = false,
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
      fill={fill}
      label={label}
      labelPlacement="floating"
      disabled={disabled}
      clearOnEdit={false}
      autoCorrect={autoCorrect}
      spellcheck={spellCheck}
      ref={ionInputEl}
      maxlength={maxlen ? maxlen : undefined}
      counter={count}
      onIonInput={handleInput}
    >
      {type === "password" && (
        <IonInputPasswordToggle slot="end" tabIndex={-1} />
      )}
    </IonInput>
  );
}

export default FormInput;
