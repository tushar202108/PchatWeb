
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { tokenStore, axiosService } from "../Axios/axiosService";
import API from "../services/APIEndpoint";
import { ProfileImage } from "../services/ProfileImageService";

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
  profileImageUrl: string;
  hasSession: boolean;
  isLoading: boolean;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void>;
  completeProfile: (payload: ProfilePayload) => Promise<void>;
  signOut: (payload: SignOut) => Promise<void>;
  refreshProfileImage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile image from shared cache
  const loadProfileImage = useCallback(async (userId: string | number) => {
    try {
      const imageUrl = await ProfileImage.getProfileImage(userId);
      setProfileImageUrl(imageUrl);
    } catch (error) {
      console.error("Profile image loading failed:", error);
      setProfileImageUrl("");
    }
  }, []);
const refreshProfileImage = useCallback(async () => {
  if (!user?.id) return;

  // Remove and revoke the old cached image
  ProfileImage.clearProfileImage(user.id);

  // Fetch the newly uploaded image
  const imageUrl = await ProfileImage.getProfileImage(user.id);

  setProfileImageUrl(imageUrl);
}, [user?.id]);
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

      tokenStore.set(data.accessToken);

      if (data.refreshToken) {
        tokenStore.setRefreshToken(data.refreshToken);
      }

      setUser(data.user);
      setHasSession(true);

      if (data.user?.id) {
        await loadProfileImage(data.user.id);
      }
    } catch (error) {
      console.error("Session restoration failed:", error);

      tokenStore.clear();
      setUser(null);
      setProfileImageUrl("");
      setHasSession(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadProfileImage]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signUp = async (payload: RegisterPayload) => {
    const response = await axiosService.post<AuthResponse>(
      API.REGISTER,
      payload
    );

    tokenStore.set(response.data.accessToken);
    setHasSession(true);
    setUser(response.data.user);

    if (response.data.user?.id) {
      await loadProfileImage(response.data.user.id);
    }
  };

  const signIn = async (payload: SignInPayload) => {
    const response = await axiosService.post<AuthResponse>(
      API.SIGN_IN,
      payload
    );

    tokenStore.set(response.data.accessToken);
    tokenStore.setRefreshToken(response.data.refreshToken);
    setHasSession(true);
    setUser(response.data.user);

    if (response.data.user?.id) {
      await loadProfileImage(response.data.user.id);
    }
  };

  const completeProfile = async (payload: ProfilePayload) => {
    await axiosService.post(API.UPDATE_PROFILE, payload);

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

  const signOut = async (payload: SignOut) => {
    try {
      await axiosService.post(API.SIGN_OUT, payload);
    } finally {
      tokenStore.clear();
      setUser(null);
      setProfileImageUrl("");
      setHasSession(false);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        profileImageUrl,
        hasSession,
        isLoading,
        signUp,
        signIn,
        completeProfile,
        signOut,refreshProfileImage
      },
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
