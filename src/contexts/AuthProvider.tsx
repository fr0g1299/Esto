import { useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

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
