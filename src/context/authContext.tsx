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
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  hasSession: boolean;
  isLoading: boolean;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  completeProfile: (payload: ProfilePayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const response = await axiosService.post<AuthResponse>(API.REFRESH);

      tokenStore.set(response.data.accessToken);
      setHasSession(true);
    } catch {
      // tokenStore.clear(); // temporarily set
      // setUser(null);
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
    setHasSession(true);
    console.log("response.user", response.data.user);
    setUser(response.data.user);
  };

  const completeProfile = async (payload: ProfilePayload) => {
    const response = await axiosService.post<AuthUser>(
      API.UPDATE_PROFILE,
      null,
      {
        params: payload,
      },
    );

    // setUser(response.data);
    setHasSession(true);
  };
  const signOut = async () => {
    try {
      await axiosService.post(API.SIGN_OUT);
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
