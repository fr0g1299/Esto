import { createContext } from "react";
import { User } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  role: "Admin" | "User" | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});
