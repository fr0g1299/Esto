import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  // sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

    // For future use: Uncomment if you want to send a verification email
    // if (user) {
    //   await sendEmailVerification(user);
    //   console.log("Verification email sent");
    // }

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

    await signOut(auth);

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

    // For future use: Uncomment if you want to check email verification
    // if (user && !user.emailVerified) {
    //   await auth.signOut();
    //   throw new Error("Please verify your email before logging in.");
    // }

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
