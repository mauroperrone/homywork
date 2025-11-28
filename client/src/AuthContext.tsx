// client/src/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import { CurrentUser, fetchCurrentUser, UserRole } from "./api";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  isGuest: boolean;
  isHost: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      setLoading(true);
      const me = await fetchCurrentUser();
      setUser(me);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, []);

  const role: UserRole | null = user?.role ?? null;

  const value: AuthContextValue = {
    user,
    loading,
    isGuest: role === "guest",
    isHost: role === "host",
    isAdmin: role === "admin",
    refetch: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
