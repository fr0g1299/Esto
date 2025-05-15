import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const hapticsLight = async () => {
  await Haptics.impact({ style: ImpactStyle.Light });
};

export const hapticsMedium = async () => {
  await Haptics.impact({ style: ImpactStyle.Medium });
};

export const hapticsHeavy = async () => {
  await Haptics.impact({ style: ImpactStyle.Heavy });
};

export const hapticsVibrate = async (duration = 300) => {
  await Haptics.vibrate({ duration });
};

export const hapticsSelectionStart = async () => {
  await Haptics.selectionStart();
};

export const hapticsSelectionChanged = async () => {
  await Haptics.selectionChanged();
};

export const hapticsSelectionEnd = async () => {
  await Haptics.selectionEnd();
};
