import { IonModal, IonButton, IonIcon, IonImg } from "@ionic/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom, Pagination } from "swiper/modules";
import { closeOutline, imagesOutline } from "ionicons/icons";
import { useState } from "react";

import "swiper/css";
import "swiper/css/zoom";
import "swiper/css/pagination";

import "./ImageViewerModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  images: { imageUrl: string; altText?: string }[];
}

const ImageViewerModal: React.FC<Props> = ({ isOpen, onClose, images }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  const handleGalleryClose = (index: number) => {
    setClosing(true);
    setStartIndex(index);
    setTimeout(() => {
      setGalleryOpen(false);
      setClosing(false);
    }, 150);
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="image-viewer-modal"
    >
      <IonButton
        fill="clear"
        className="gallery-button"
        onClick={() => setGalleryOpen(!galleryOpen)}
      >
        <IonIcon icon={imagesOutline} slot="icon-only" />
      </IonButton>

      <IonButton fill="clear" className="close-button" onClick={onClose}>
        <IonIcon icon={closeOutline} slot="icon-only" />
      </IonButton>

      {galleryOpen ? (
        <div
          className={`image-gallery-container ${
            closing ? "fade-out" : "fade-in"
          }`}
        >
          {images.map((img, idx) => (
            <div key={idx} className="image-container" id={`img-${idx}`}>
              <IonImg
                src={img.imageUrl}
                alt={img.altText}
                className="image-gallery"
                onClick={() => {
                  handleGalleryClose(idx);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <Swiper
            initialSlide={startIndex}
            zoom={{ maxRatio: 5 }}
            pagination={{ type: "fraction", clickable: true }}
            modules={[Zoom, Pagination]}
            style={{ height: "100%" }}
            loop={true}
            onSlideChange={(swiper) => {
              setStartIndex(swiper.realIndex);
            }}
            className="swiper-zoom-container"
          >
            {images.map((img, idx) => (
              <SwiperSlide key={idx}>
                <div className="swiper-zoom-container">
                  <img src={img.imageUrl} alt={img.altText} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </IonModal>
  );
};

export default ImageViewerModal;
