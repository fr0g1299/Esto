import { db, storage } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Property {
  ownerId: string;
  title: string;
  price: number;
  status: "Available" | "Sold";
  address: string;
  city: string;
  type: "Byt" | "Apartmán" | "Dům" | "Vila" | "Chata" | "Chalupa";
  disposition: string;
  imageUrl: string;
  geolocation: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
  garage: boolean;
  elevator: boolean;
  gasConnection: boolean;
  threePhaseElectricity: boolean;
  basement: boolean;
  furnished: boolean;
  balcony: boolean;
  garden: boolean;
  solarPanels: boolean;
  pool: boolean;
}

interface PropertyDetails {
  yearBuilt: number;
  floors: number;
  bathroomCount: number;
  gardenSize: number;
  propertySize: number;
  parkingSpots: number;
  rooms: number;
  postalCode: string;
  description: string;
  kitchenEquipment: string[];
  heatingType: string;
  videoUrl: string;
}
const uploadImage = async (file: File, propertyId: string): Promise<string> => {
  const options = {
    maxSizeMB: 5,
    maxWidthOrHeight: 2560,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, options);

  console.log("Original:", file.size / 1024, "KB");
  console.log("Compressed:", compressedFile.size / 1024, "KB");

  const imageId = uuidv4();
  const storageRef = ref(storage, `properties/${propertyId}/images/${imageId}`);
  await uploadBytes(storageRef, compressedFile);

  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
};

export const createProperty = async (
  propertyData: Omit<Property, "createdAt" | "updatedAt" | "imageUrl">,
  detailsData: PropertyDetails,
  imageFiles: File[]
) => {
  const propertyRef = await addDoc(collection(db, "properties"), {
    ...propertyData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const propertyId = propertyRef.id;

  await setDoc(
    doc(db, "properties", propertyId, "details", "data"),
    detailsData
  );

  const uploadedImageUrls = await Promise.all(
    imageFiles.map((file) => uploadImage(file, propertyId))
  );

  const formattedImages = uploadedImageUrls.map((url, index) => ({
    imageUrl: url,
    altText: `Image ${index + 1}`,
    sortOrder: index + 1,
  }));

  const imageCollectionRef = collection(db, `properties/${propertyId}/images`);
  await Promise.all(
    formattedImages.map((img) => addDoc(imageCollectionRef, img))
  );

  await updateDoc(doc(db, "properties", propertyId), {
    imageUrl: formattedImages[0].imageUrl,
  });

  return propertyId;
};
