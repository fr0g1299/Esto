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
  query,
  orderBy,
  limit,
  where,
  startAfter,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { User } from "firebase/auth";

import { sendPriceDropNotification } from "./notificationsService";
import { isPropertyFavorited } from "./favoritesService";
import { geocodeAddress, getBoundingBoxFromRadius } from "./geocodingService";
import {
  Property,
  PropertyDetailsData,
  PropertyData,
  UploadedImage,
  NotificationProps,
  UserContact,
  TrendingProperty,
  PropertySearchResults,
  NewestProperty,
  PropertyMarker,
  SearchQueryParams,
  SearchResults,
} from "../types/interfaces";

import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

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
  propertyData: Omit<
    Property,
    "propertyId" | "createdAt" | "updatedAt" | "imageUrl" | "views"
  >,
  detailsData: PropertyDetailsData,
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

  const detailsData = detailsSnapshot.data() as PropertyDetailsData;

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
  detailsData: Partial<PropertyDetailsData>,
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

export const fetchTrendingProperties = async (): Promise<
  TrendingProperty[]
> => {
  const q = query(collection(db, "trending"), orderBy("views", "desc"));
  const propertiesSnapshot = await getDocs(q);
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TrendingProperty, "id">),
  }));
};

export const fetchNewestProperties = async (): Promise<NewestProperty[]> => {
  const q = query(
    collection(db, "properties"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const propertiesSnapshot = await getDocs(q);
  return propertiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<NewestProperty, "id">),
  }));
};

const incrementViews = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("Property ID is required");
  }

  try {
    const docRef = doc(db, "properties", id);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error("Failed to increment views:", error);
    throw error;
  }
};

export const fetchPropertyData = async (
  propertyId: string,
  user: User | null,
  refresh: boolean = false
): Promise<PropertyData> => {
  if (!propertyId) {
    return { exists: false };
  }

  try {
    // Fetch property document
    const propertyDoc = await getDoc(doc(db, "properties", propertyId));
    if (!propertyDoc.exists()) {
      return { exists: false };
    }

    // Fetch details, images, and user
    const [detailsDoc, imageDocs, userDoc] = await Promise.all([
      getDoc(doc(db, "properties", propertyId, "details", "data")),
      getDocs(collection(db, "properties", propertyId, "images")),
      getDoc(doc(db, "users", propertyDoc.data()?.ownerId)),
    ]);

    // Process property data
    const propertyData = propertyDoc.data() as Property;
    const property: Property = { ...propertyData, propertyId };

    // Process features
    const features = [
      { label: "Garáž", value: propertyData.garage },
      { label: "Výtah", value: propertyData.elevator },
      { label: "Plynové připojení", value: propertyData.gasConnection },
      {
        label: "Třífázová elektřina",
        value: propertyData.threePhaseElectricity,
      },
      { label: "Sklep", value: propertyData.basement },
      { label: "Zařízený", value: propertyData.furnished },
      { label: "Balkón", value: propertyData.balcony },
      { label: "Zahrada", value: propertyData.garden },
      { label: "Solární panely", value: propertyData.solarPanels },
      { label: "Bazén", value: propertyData.pool },
    ];

    // Process details and card details
    const details = detailsDoc.exists()
      ? (detailsDoc.data() as PropertyDetailsData)
      : undefined;
    const cardDetails = detailsDoc.exists()
      ? [
          { label: "Počet pokojů", value: details!.rooms },
          { label: "Koupelny", value: details!.bathroomCount },
          { label: "Podlaží", value: details!.floors },
          { label: "Rok výstavby", value: details!.yearBuilt },
          { label: "Parkovací místa", value: details!.parkingSpots },
          { label: "Vytápění", value: details!.heatingType },
        ]
      : undefined;

    // Process user contact
    const userContact = userDoc.exists()
      ? (userDoc.data() as UserContact)
      : undefined;

    // Process images
    const images = imageDocs.docs
      .map((doc) => doc.data() as UploadedImage)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    // Increment views if not refreshing
    if (!refresh) {
      await incrementViews(propertyId);
    }

    // Check if property is favorited
    const isFavorite = user
      ? await isPropertyFavorited(user.uid, propertyId)
      : false;

    return {
      exists: true,
      property,
      features,
      details,
      cardDetails,
      userContact,
      images,
      isFavorite,
    };
  } catch (error) {
    console.error("Error fetching property data:", error);
    throw error;
  }
};

export const fetchAllProperties = async (): Promise<PropertyMarker[]> => {
  try {
    const propRef = collection(db, "properties");
    const propSnap = await getDocs(propRef);
    const props: PropertyMarker[] = propSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        geolocation: data.geolocation,
        imageUrl: data.imageUrl,
      };
    });
    return props;
  } catch (error) {
    console.error("Error fetching all properties:", error);
    throw error;
  }
};

export const fetchPropertySearchResults = async (
  queryParams: SearchQueryParams,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  pageSize: number = 5,
  isPaginating: boolean = false
): Promise<SearchResults> => {
  try {
    const propertyRef = collection(db, "properties");
    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
      limit(pageSize),
    ];

    // Filters
    if (queryParams.city) {
      constraints.push(where("city", "==", queryParams.city));
    }
    if (queryParams.address) {
      const radius = parseFloat(queryParams.radius || "15");
      try {
        const { latitude, longitude } = await geocodeAddress(
          queryParams.address
        );
        const { sw, ne } = getBoundingBoxFromRadius(
          latitude,
          longitude,
          radius
        );
        constraints.push(
          where("geolocation.latitude", "<=", ne.lat),
          where("geolocation.latitude", ">=", sw.lat),
          where("geolocation.longitude", "<=", ne.lng),
          where("geolocation.longitude", ">=", sw.lng)
        );
      } catch (err) {
        console.error("Error geocoding address:", err);
        // Fallback to broad geolocation constraints
        constraints.push(
          where("geolocation.latitude", "<=", 90),
          where("geolocation.latitude", ">=", -90),
          where("geolocation.longitude", "<=", 180),
          where("geolocation.longitude", ">=", -180)
        );
      }
    } else {
      constraints.push(
        where("geolocation.latitude", "<=", 90),
        where("geolocation.latitude", ">=", -90),
        where("geolocation.longitude", "<=", 180),
        where("geolocation.longitude", ">=", -180)
      );
    }
    if (queryParams.type) {
      constraints.push(where("type", "==", queryParams.type));
    }
    if (queryParams.disposition) {
      constraints.push(where("disposition", "==", queryParams.disposition));
    }

    // Price
    constraints.push(
      where("price", ">=", parseInt(queryParams.minPrice || "0"))
    );
    if (queryParams.maxPrice) {
      constraints.push(
        where("price", "<=", parseInt(queryParams.maxPrice || "99999999"))
      );
    }

    // Chips
    if (queryParams.garage === "true") {
      constraints.push(where("garage", "==", true));
    }
    if (queryParams.elevator === "true") {
      constraints.push(where("elevator", "==", true));
    }
    if (queryParams.gasConnection === "true") {
      constraints.push(where("gasConnection", "==", true));
    }
    if (queryParams.threePhaseElectricity === "true") {
      constraints.push(where("threePhaseElectricity", "==", true));
    }
    if (queryParams.basement === "true") {
      constraints.push(where("basement", "==", true));
    }
    if (queryParams.furnished === "true") {
      constraints.push(where("furnished", "==", true));
    }
    if (queryParams.balcony === "true") {
      constraints.push(where("balcony", "==", true));
    }
    if (queryParams.garden === "true") {
      constraints.push(where("garden", "==", true));
    }
    if (queryParams.solarPanels === "true") {
      constraints.push(where("solarPanels", "==", true));
    }
    if (queryParams.pool === "true") {
      constraints.push(where("pool", "==", true));
    }

    // Pagination
    if (isPaginating && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const queryRef = query(propertyRef, ...constraints);
    const snapshot = await getDocs(queryRef);

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<PropertySearchResults, "id">),
    }));

    return {
      properties: results,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.size === pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    throw error;
  }
};
