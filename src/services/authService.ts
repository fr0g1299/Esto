import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
  updatePassword,
  // sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

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

export const registerUser = async (
  email: string,
  password: string,
  userData: Omit<
    UserProfile,
    "email" | "createdAt" | "lastSeen" | "viewedHistory" | "userRole"
  >
) => {
  try {
    const usernameTaken = httpsCallable(functions, "usernameTaken");

    try {
      const result = await usernameTaken({ username: userData.username });

      const data = result.data as { isTaken: boolean };
      console.log("Username check result:", data);
      if (data.isTaken) {
        throw new Error("auth/username-taken");
      }
    } catch (error) {
      console.error("Error during username check:", error);
      throw error;
    }

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
      pushNotificationsEnabled: true,
      userRole: "User",
    });

    await addDoc(collection(db, `users/${user.uid}/favoriteFolders`), {
      title: "Oblíbené",
      propertyCount: 0,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, `users/${user.uid}/notifications`), {
      title: "Vítejte!",
      message: "Váš účet byl úspěšně vytvořen.",
      isRead: false,
      timestamp: serverTimestamp(),
      type: "system",
      actionId: null,
      actionUrl: null,
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

    // // For future use: Uncomment if you want to check email verification
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
export const changeUserPassword = async (
  oldPassword: string,
  newPassword: string
) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error("User not authenticated.");
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);
    console.log("Password updated successfully.");
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};
