import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "../config/apiConfig";

// Enable credentials globally if required across all axios imports
axios.defaults.withCredentials = true;

// let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const TOKEN_KEY = "app_access_token";
const REFRESH_TOKEN_KEY = "app_refresh_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),

  set: (token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setRefreshToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const axiosService = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
});
refreshClient.interceptors.request.use((config) => {
  console.log("REFRESH REQUEST INTERCEPTOR");
  console.log("URL:", config.url);
  console.log("METHOD:", config.method);
  console.log("BODY:", config.data);

  return config;
});

axiosService.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});


async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const refreshToken = tokenStore.getRefreshToken();

    console.log("REFRESH FUNCTION CALLED");
    console.log("TOKEN EXISTS:", !!refreshToken);

    if (!refreshToken) {
      return null;
    }

    refreshPromise = refreshClient
      .post(
        "/auth/refresh",
        { refreshToken }
      )
      .then(({ data }) => {
        tokenStore.set(data.accessToken);

        if (data.refreshToken) {
          tokenStore.setRefreshToken(data.refreshToken);
        }

        return data.accessToken;
      })
      .catch((error) => {
        console.error("REFRESH ERROR:", error.response?.status);
        console.error("RESPONSE:", error.response?.data);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

axiosService.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const token = await refreshAccessToken();

    if (!token) {
      window.dispatchEvent(new Event("auth:expired"));
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${token}`);

    return axiosService(originalRequest);
  },
);