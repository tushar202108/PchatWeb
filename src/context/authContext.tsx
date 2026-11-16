import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { tokenStore, axiosService } from "../Axios/axiosService";
import API from "../services/APIEndpoint";

import type {
  AuthResponse,
  AuthUser,
  ProfilePayload,
  RegisterPayload,
  SignInPayload,
  SignOut,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  hasSession: boolean;
  isLoading: boolean;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  completeProfile: (payload: ProfilePayload) => Promise<void>;
  signOut: (payload:SignOut) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

const restoreSession = useCallback(async () => {
  try {
    const refreshToken = tokenStore.getRefreshToken();

    if (!refreshToken) {
      throw new Error("Refresh token not found");
    }

    const response = await axiosService.post<AuthResponse>(
      API.REFRESH,
      { refreshToken }
    );

    const data = response.data;

    // Save both tokens
    tokenStore.set(data.accessToken);

    if (data.refreshToken) {
      tokenStore.setRefreshToken(data.refreshToken);
    }

    // Restore authenticated user
    setUser(data.user);

    setHasSession(true);

  } catch (error) {
    console.error("Session restoration failed:", error);

    tokenStore.clear();
    setUser(null);
    setHasSession(false);

  } finally {
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signUp = async (payload: RegisterPayload) => {
    const response = await axiosService.post<AuthResponse>(
      API.REGISTER,
      payload,
    );

    tokenStore.set(response.data.accessToken);
    setHasSession(true);

    setUser(response.data.user);
  };

  const signIn = async (payload: SignInPayload) => {
    const response = await axiosService.post<AuthResponse>(
      API.SIGN_IN,
      payload,
    );

    tokenStore.set(response.data.accessToken);
    tokenStore.setRefreshToken(response.data.refreshToken);
    setHasSession(true);
    console.log("response.user", response.data.user);
    setUser(response.data.user);
  };

const completeProfile = async (payload: ProfilePayload) => {
  await axiosService.post(
    API.UPDATE_PROFILE,
 payload
  );
  setUser((currentUser) =>
    currentUser
      ? {
          ...currentUser,
          name: payload.name,
        }
      : currentUser
  );

  setHasSession(true);
};
  const signOut = async (payload:SignOut) => {
    try {
      await axiosService.post(API.SIGN_OUT,payload);
    } finally {
      tokenStore.clear();
      setUser(null);
      setHasSession(false);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        hasSession,
        isLoading,
        signUp,
        signIn,
        completeProfile,
        signOut,
      },
    },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
