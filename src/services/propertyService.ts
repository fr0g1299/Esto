import { db, storage } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { sendPriceDropNotification } from "./notificationsService";

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
}

interface UploadedImage {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

interface NotificationProps {
  id: string;
  title: string;
  price: number;
  createdAt: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimStringFields<T extends Record<string, any>>(obj: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trimmed: any = {};
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      trimmed[key] = obj[key].trim();
    } else {
      trimmed[key] = obj[key];
    }
  }
  return trimmed as T;
}

export const createProperty = async (
  propertyData: Omit<Property, "createdAt" | "updatedAt" | "imageUrl">,
  detailsData: PropertyDetails,
  imageFiles: File[]
) => {
  const trimmedPropertyData = trimStringFields(propertyData);
  const trimmedDetailsData = trimStringFields(detailsData);

  const propertyRef = await addDoc(collection(db, "properties"), {
    ...trimmedPropertyData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const propertyId = propertyRef.id;

  await setDoc(
    doc(db, "properties", propertyId, "details", "data"),
    trimmedDetailsData
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

export const getPropertyById = async (propertyId: string) => {
  const propertyRef = doc(db, "properties", propertyId);
  const propertySnapshot = await getDoc(propertyRef);

  if (!propertySnapshot.exists()) {
    throw new Error("Property not found");
  }

  const propertyData = propertySnapshot.data() as Property;
  const detailsRef = doc(db, "properties", propertyId, "details", "data");
  const detailsSnapshot = await getDoc(detailsRef);

  const imagesCollectionRef = collection(db, `properties/${propertyId}/images`);
  const imagesSnapshot = await getDocs(imagesCollectionRef);

  const images = imagesSnapshot.docs.map((doc) => doc.data());

  if (!detailsSnapshot.exists()) {
    throw new Error("Property details not found");
  }

  const detailsData = detailsSnapshot.data() as PropertyDetails;

  return { ...propertyData, ...detailsData, images };
};

function extractStoragePathFromUrl(url: string): string | null {
  const matches = url.match(/\/o\/(.*?)\?alt=media/);
  if (matches && matches[1]) {
    return decodeURIComponent(matches[1]);
  }
  return null;
}

export const updateProperty = async (
  propertyId: string,
  propertyData: Partial<Omit<Property, "createdAt" | "updatedAt">>,
  detailsData: Partial<PropertyDetails>,
  newImageFiles: File[] = [],
  keptImages: UploadedImage[] = [],
  removedImages: UploadedImage[] = []
) => {
  const propertyRef = doc(db, "properties", propertyId);

  const trimmedPropertyData = trimStringFields(propertyData);
  const trimmedDetailsData = trimStringFields(detailsData);

  const prevSnapshot = await getDoc(propertyRef);
  const previousPrice = prevSnapshot.data()?.price;

  if (
    previousPrice &&
    trimmedPropertyData.price != null &&
    trimmedPropertyData.price < previousPrice
  ) {
    await sendPriceDropNotification(propertyId, trimmedPropertyData.price);
  }

  await updateDoc(propertyRef, {
    ...trimmedPropertyData,
    updatedAt: serverTimestamp(),
  });

  // Update the details document if provided
  if (trimmedDetailsData) {
    const detailsRef = doc(db, "properties", propertyId, "details", "data");
    await updateDoc(detailsRef, trimmedDetailsData);
  }

  const imageCollectionRef = collection(db, `properties/${propertyId}/images`);

  // Delete removed images from Firestore and Storage
  for (const image of removedImages) {
    const docRef = doc(imageCollectionRef, image.sortOrder?.toString());
    await deleteDoc(docRef);

    const storagePath = extractStoragePathFromUrl(image.imageUrl);
    if (storagePath) {
      await deleteObject(ref(storage, storagePath));
    }
  }

  // Upload new image files
  const newUploadedUrls = await Promise.all(
    newImageFiles.map(async (file, index) => {
      const imageId = uuidv4();
      const storageRef = ref(
        storage,
        `properties/${propertyId}/images/${imageId}`
      );
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      return {
        imageUrl: downloadUrl,
        altText: `Image ${index + 1}`,
        sortOrder: keptImages.length + index + 1,
      };
    })
  );

  // Merge kept + new, then rewrite Firestore subcollection
  const finalImages = [...keptImages, ...newUploadedUrls];

  const imagesRef = collection(db, "properties", propertyId, "images");

  const existingDocs = await getDocs(imagesRef);
  const batch = writeBatch(db);

  existingDocs.forEach((doc) => batch.delete(doc.ref)); // Clear old records
  finalImages.forEach((img, i) => {
    const docRef = doc(imagesRef);
    batch.set(docRef, {
      ...img,
      sortOrder: i + 1,
    });
  });

  await batch.commit();

  // Update thumbnail
  if (finalImages.length) {
    await updateDoc(propertyRef, {
      imageUrl: finalImages[0].imageUrl,
    });
  }

  return propertyId;
};

// Get all properties with enabled notifications
export const getNotificationProperties = async (
  userId: string
): Promise<NotificationProps[]> => {
  const snapshot = await getDocs(
    collection(db, "users", userId, "notificationsPreferences")
  );
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    price: doc.data().price,
    createdAt: doc.data().createdAt,
  }));
};
