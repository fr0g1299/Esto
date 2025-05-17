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
import { useRef, useState, useEffect, useMemo, memo } from "react";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface UploadedImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

type ImageType = File | UploadedImage;

interface ImageWithId {
  id: string;
  image: ImageType;
}

interface Props {
  images: ImageType[];
  setImages: (files: ImageType[]) => void;
  max?: number;
  onRemoveUploadedImage?: (image: UploadedImage) => void;
}

import React from "react";
import { hapticsLight } from "../../services/haptics";

const SortableImage = memo(
  ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition,
      touchAction: "none",
      zIndex: isDragging ? 10 : 0,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  }
);

const ImageUploader: React.FC<Props> = ({
  images,
  setImages,
  max = 20,
  onRemoveUploadedImage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const modal = useRef<HTMLIonModalElement>(null);
  const [showToast] = useIonToast();
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(new Map());
  const [localImages, setLocalImages] = useState<ImageWithId[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 15,
        tolerance: 5,
      },
    })
  );

  // Generate unique IDs for images
  const imagesWithIds = useMemo(() => {
    return images.map((img, idx) => ({
      id: img instanceof File ? `file-${idx}` : img.id || `uploaded-${idx}`,
      image: img,
    }));
  }, [images]);

  // Sync localImages with imagesWithIds when images change, preserving object URLs
  useEffect(() => {
    const newLocalImages = imagesWithIds.map((item) => {
      if (item.image instanceof File && !objectUrls.has(item.image)) {
        objectUrls.set(item.image, URL.createObjectURL(item.image));
      }
      return { ...item };
    });
    setLocalImages(newLocalImages);
  }, [imagesWithIds, objectUrls]);

  // Manage object URLs and cleanup only when File objects are removed
  useEffect(() => {
    const currentFiles = new Set(images.filter((img) => img instanceof File));
    const urlsToRevoke = new Map(
      [...objectUrls].filter(([file]) => !currentFiles.has(file))
    );

    urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    setObjectUrls((prev) => {
      const newUrls = new Map(prev);
      urlsToRevoke.forEach((_, file) => newUrls.delete(file));
      return newUrls;
    });
    //eslint-disable-next-line
  }, [images]);

  const handleDragStart = () => {
    setTimeout(async () => {
      await hapticsLight();
    }, 15);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over?.id);
      const sorted = arrayMove(localImages, oldIndex, newIndex);
      setLocalImages(sorted);
      hapticsLight();
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
        const updated = [...localImages];
        const removedImage = updated.splice(index, 1)[0].image;

        if (!(removedImage instanceof File) && onRemoveUploadedImage) {
          onRemoveUploadedImage(removedImage);
        }

        setLocalImages(updated);
        setImages(updated.map((item) => item.image));

        if (removedImage instanceof File && objectUrls.has(removedImage)) {
          URL.revokeObjectURL(objectUrls.get(removedImage)!);
          setObjectUrls((prev) => {
            const newUrls = new Map(prev);
            newUrls.delete(removedImage);
            return newUrls;
          });
        }
      }, 300);
    }
  };

  const handleModalDismiss = () => {
    setImages(localImages.map((item) => item.image));
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
            fill="clear"
            onClick={() => inputRef.current?.click()}
            className="ion-text-center"
          >
            Vybrat obrázky
          </IonButton>
        </IonCol>

        <IonCol size="auto">
          <IonButton
            fill="outline"
            id="open-modal"
            disabled={localImages.length === 0}
            style={{
              fontSize: localImages.length >= 10 ? "0.8rem" : "",
            }}
          >
            Otevřít náhled ({localImages.length})
          </IonButton>
        </IonCol>
      </IonRow>

      <IonModal
        ref={modal}
        trigger="open-modal"
        className="image-uploader-modal"
        onDidDismiss={handleModalDismiss}
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localImages.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="image-preview-container">
                {localImages.map((item, idx) => {
                  const img = item.image;
                  return (
                    <SortableImage key={item.id} id={item.id}>
                      <div className="image-container" id={`img-${idx}`}>
                        <IonImg
                          src={
                            img instanceof File
                              ? objectUrls.get(img) || ""
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
                  );
                })}
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
