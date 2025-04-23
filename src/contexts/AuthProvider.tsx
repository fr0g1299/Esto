import { useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";
import { doc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PushNotifications } from "@capacitor/push-notifications";

const savePushToken = async (uid: string) => {
  try {
    const permissionStatus = await PushNotifications.checkPermissions();

    if (permissionStatus.receive !== "granted") {
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== "granted") {
        console.warn("Push notification permission not granted");
        return;
      }
    }

    await PushNotifications.register();

    PushNotifications.addListener("registration", async (token) => {
      if (token?.value) {
        await setDoc(
          doc(db, "users", uid),
          { pushToken: token.value },
          { merge: true }
        );
        console.log("Push token saved!");
      }
    });
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp(),
        });

        await savePushToken(firebaseUser.uid);
      }

      console.log("User state changed:", firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
