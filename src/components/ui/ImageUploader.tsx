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

interface UploadedImage {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

type ImageType = File | UploadedImage;

interface Props {
  images: ImageType[];
  setImages: (files: ImageType[]) => void;
  max?: number;
  onRemoveUploadedImage?: (image: UploadedImage) => void; // Callback for removing already uploaded images
}

const ImageUploader: React.FC<Props> = ({
  images,
  setImages,
  max = 20,
  onRemoveUploadedImage,
}) => {
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
        const removedImage = updated.splice(index, 1)[0];

        // If the removed image is an already uploaded image, call the callback
        if (!(removedImage instanceof File) && onRemoveUploadedImage) {
          onRemoveUploadedImage(removedImage);
        }
        console.log(updated);

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
                  src={
                    img instanceof File
                      ? URL.createObjectURL(img) // For new uploads
                      : img.imageUrl // For already uploaded images
                  }
                  alt={img instanceof File ? img.name : img.altText}
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
