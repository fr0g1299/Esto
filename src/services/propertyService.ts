import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";

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
  geolocation: GeoPoint;
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

export const createProperty = async (
  propertyData: Omit<Property, "createdAt" | "updatedAt">,
  detailsData: PropertyDetails,
  images: { imageUrl: string; altText?: string; sortOrder: number }[]
) => {
  // Create main property document
  const propertyRef = await addDoc(collection(db, "properties"), {
    ...propertyData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Set property details
  await setDoc(
    doc(db, "properties", propertyRef.id, "details", "data"),
    detailsData
  );

  // Set property images
  const imagesCollection = collection(
    db,
    "properties",
    propertyRef.id,
    "images"
  );
  for (const image of images) {
    await addDoc(imagesCollection, image);
  }

  return propertyRef.id;
};
