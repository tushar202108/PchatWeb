
import { axiosService } from "../Axios/axiosService";
import API from "./APIEndpoint";

const imageCache = new Map<string, { url: string; timestamp: number }>();
const pendingRequests = new Map<string, Promise<string>>();
const CACHE_DURATION = 60 * 1000;

type ProfileImageListener = (userId: string, url: string) => void;

const listeners = new Set<ProfileImageListener>();

const notifyListeners = (userId: string, url: string) => {
  listeners.forEach((listener) => listener(userId, url));
};

export const ProfileImage = {
subscribe(listener: ProfileImageListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
},
  

  async getProfileImage(
    userId: string | number,
    forceRefresh = false
  ): Promise<string> {
    const id = String(userId);

    const cached = imageCache.get(id);

    if (
      !forceRefresh &&
      cached &&
      Date.now() - cached.timestamp < CACHE_DURATION
    ) {
      return cached.url;
    }

    if (!forceRefresh) {
      const pending = pendingRequests.get(id);
      if (pending) return pending;
    }

    if (forceRefresh) {
      const oldImage = imageCache.get(id);
      if (oldImage) URL.revokeObjectURL(oldImage.url);
      imageCache.delete(id);
    }

    const request = (async () => {
      try {
        const { data } = await axiosService.post(
          API.Get_Profile_image(id),
          null,
          { responseType: "blob" }
        );

        if (!data || data.size === 0) {
          throw new Error("Profile image is empty");
        }

        const imageUrl = URL.createObjectURL(data);

        const previous = imageCache.get(id);
        if (previous) URL.revokeObjectURL(previous.url);

        imageCache.set(id, {
          url: imageUrl,
          timestamp: Date.now(),
        });

        notifyListeners(id, imageUrl);

        return imageUrl;
      } finally {
        pendingRequests.delete(id);
      }
    })();

    pendingRequests.set(id, request);
    return request;
  },

  async refreshProfileImage(userId: string | number) {
    return this.getProfileImage(userId, true);
  },

  clearProfileImage(userId: string | number) {
    const id = String(userId);
    const oldImage = imageCache.get(id);

    if (oldImage) {
      URL.revokeObjectURL(oldImage.url);
      imageCache.delete(id);
    }

    pendingRequests.delete(id);
  },
};
