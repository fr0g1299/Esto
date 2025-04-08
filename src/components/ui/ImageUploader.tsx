import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonHeader,
  IonImg,
  IonModal,
  IonRow,
  IonToolbar,
} from "@ionic/react";
import { useRef } from "react";
import "./ImageUploader.css";

interface Props {
  images: File[];
  setImages: (files: File[]) => void;
  max?: number;
}

const ImageUploader: React.FC<Props> = ({ images, setImages, max = 20 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const modal = useRef<HTMLIonModalElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + files.length;

    if (total > max) {
      alert(`You can upload max ${max} images.`); // TODO: Alert
      return;
    }

    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    const imgEl = document.getElementById(`img-${index}`);
    if (imgEl) {
      imgEl.classList.add("fade-out");

      setTimeout(() => {
        const updated = [...images];
        updated.splice(index, 1);
        setImages(updated);
      }, 300);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        hidden
        ref={inputRef}
      />

      <IonRow className="ion-justify-content-center ion-margin-bottom">
        <IonCol size="auto">
          <IonButton
            onClick={() => inputRef.current?.click()}
            className="ion-text-center"
          >
            Vybrat obrázky
          </IonButton>
        </IonCol>

        <IonCol size="auto">
          <IonButton id="open-modal" disabled={images.length === 0}>
            Otevřít náhled ({images.length})
          </IonButton>
        </IonCol>
      </IonRow>

      <IonModal ref={modal} trigger="open-modal">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => modal.current?.dismiss()}>
                Zrušit
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="image-preview-container">
            {images.map((img, idx) => (
              <div key={idx} className="image-container" id={`img-${idx}`}>
                <IonImg
                  src={URL.createObjectURL(img)}
                  alt={`preview-${idx}`}
                  className="image-preview"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default ImageUploader;
