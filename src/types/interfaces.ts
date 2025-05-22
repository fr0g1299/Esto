import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

export interface LocationState {
  userContact?: {
    firstName?: string;
    lastName?: string;
  };
  propertyId: string;
}

export interface Chat {
  id: string;
  title: string;
  propertyId: string;
  lastMessage: string;
  otherUserFirstName: string;
  otherUserLastName: string;
  imageUrl: string;
}

export interface HistoryProps {
  propertyId: string;
  title: string;
  price: number;
  imageUrl: string;
}

export interface FolderProps {
  id: string;
  title: string;
  propertyCount: number;
}

export interface FilterProps {
  id: string;
  title: string;
  criteria: string;
}

export interface OfflineProperty {
  propertyId: string;
  title: string;
  price: number;
  city: string;
}

export interface NotificationProps {
  id: string;
  title: string;
  price: number;
  createdAt: string;
}

export interface UploadedImage {
  imageUrl: string;
  altText?: string;
  sortOrder?: number;
}

export interface PropertyRouteParams {
  propertyId: string;
}

export type ImageType = File | UploadedImage;

export interface FolderRouteParams {
  folderId: string;
}

export interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  disposition: string;
  imageUrl: string;
  note?: string;
}

export interface NewestProperty {
  id: string;
  title: string;
  price: number;
  city: string;
  imageUrl: string;
}

export interface TrendingProperty {
  id: string;
  propertyId: string;
  title: string;
  imageUrl: string;
  price: number;
  views: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Timestamp;
  isRead: boolean;
  isRemoving?: boolean;
  actionId?: string;
  actionUrl?: string;
}

export interface PropertyData {
  exists: boolean;
  property?: Property;
  features?: Array<{ label: string; value: boolean }>;
  details?: PropertyDetailsData;
  cardDetails?: Array<{ label: string; value: number | string }>;
  userContact?: UserContact;
  images?: UploadedImage[];
  isFavorite?: boolean;
}

export interface Property {
  propertyId?: string;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  views: number;
}

export interface PropertyDetailsData {
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

export interface UserContact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface PropertyMarker {
  id: string;
  title: string;
  geolocation: { latitude: number; longitude: number };
  imageUrl: string;
}

export interface LocationStateMap {
  properties: Property[];
}

export interface PropertySearchResults {
  id: string;
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
}

export interface SearchQueryParams {
  city?: string;
  address?: string;
  radius?: string;
  type?: string;
  disposition?: string;
  minPrice?: string;
  maxPrice?: string;
  garage?: string;
  elevator?: string;
  gasConnection?: string;
  threePhaseElectricity?: string;
  basement?: string;
  furnished?: string;
  balcony?: string;
  garden?: string;
  solarPanels?: string;
  pool?: string;
}

export interface SearchResults {
  properties: PropertySearchResults[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  views: number;
}

export interface NotificationPreference {
  notifyOnPriceDrop: boolean;
  title: string;
  price: number;
  createdAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  createdAt?: Date;
  lastSeen?: Date;
  pushNotificationsEnabled?: boolean;
  userRole: "User" | "Admin";
}

export interface FavoriteFolder {
  id: string;
  title: string;
  propertyCount: number;
}

export interface SavedFilter {
  id: string;
  title: string;
  criteria: string;
}

export interface PropertyList {
  id: string;
  title: string;
}

export interface TrendingList {
  id: string;
  title: string;
}

export interface UserList {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}
