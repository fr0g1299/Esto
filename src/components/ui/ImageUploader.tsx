import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonHeader,
  IonImg,
  IonModal,
  IonNote,
  IonRow,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import { useRef } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import "./ImageUploader.css";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableImage = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

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
  const [showToast] = useIonToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img, i) => i.toString() === active.id);
      const newIndex = images.findIndex((img, i) => i.toString() === over?.id);
      const sorted = arrayMove(images, oldIndex, newIndex);
      setImages(sorted);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + files.length;

    if (total > max) {
      showToast(`You can upload max ${max} images.`, 2500);
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

      <IonModal
        ref={modal}
        trigger="open-modal"
        className="image-uploader-modal"
      >
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, index) => index.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="image-preview-container">
                {images.map((img, idx) => (
                  <SortableImage key={idx} id={idx.toString()}>
                    <div className="image-container" id={`img-${idx}`}>
                      <IonImg
                        src={
                          img instanceof File
                            ? URL.createObjectURL(img)
                            : img.imageUrl
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
                  </SortableImage>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <IonNote className="drag-note">
            Můžete přetahovat obrázky pro změnu jejich pořadí
          </IonNote>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default ImageUploader;
