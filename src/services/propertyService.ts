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
  listAll,
} from "firebase/storage";

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

interface UploadedImage {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
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

  await updateDoc(propertyRef, {
    ...propertyData,
    updatedAt: serverTimestamp(),
  });

  // Update the details document if provided
  if (detailsData) {
    const detailsRef = doc(db, "properties", propertyId, "details", "data");
    await updateDoc(detailsRef, detailsData);
  }

  const imageCollectionRef = collection(db, `properties/${propertyId}/images`);

  // Delete removed images from Firestore and Storage
  for (const image of removedImages) {
    const docRef = doc(imageCollectionRef, image.sortOrder?.toString()); // Or use imageId if you stored it
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

export const removeProperty = async (propertyId: string) => {
  try {
    const propertyRef = doc(db, "properties", propertyId);

    // Delete property details
    const detailsRef = doc(db, "properties", propertyId, "details", "data");
    await deleteDoc(detailsRef);

    // Delete image documents from Firestore
    const imagesCollection = collection(db, "properties", propertyId, "images");
    const imagesSnapshot = await getDocs(imagesCollection);
    await Promise.all(imagesSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

    // Delete image files from Firebase Storage
    const storageFolderRef = ref(storage, `properties/${propertyId}/images`);
    const storedFiles = await listAll(storageFolderRef);

    await Promise.all(
      storedFiles.items.map((itemRef) => deleteObject(itemRef))
    );

    // Delete the main property document
    await deleteDoc(propertyRef);

    console.log(`Property ${propertyId} successfully deleted.`);
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};
