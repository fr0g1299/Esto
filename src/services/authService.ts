import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  createdAt?: Date;
  lastSeen?: Date;
  viewedHistory: string[];
  pushNotificationsEnabled: boolean;
  userRole: "User" | "Admin";
}

export const registerUser = async (
  email: string,
  password: string,
  userData: Omit<
    UserProfile,
    "email" | "createdAt" | "lastSeen" | "viewedHistory" | "userRole"
  >
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    console.log("User registered:", user);

    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      email: user.email,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      viewedHistory: [],
      pushNotificationsEnabled: true,
      userRole: "User",
    });

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("User logged in:", user);

    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        lastSeen: serverTimestamp(),
      });
    }

    return user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
