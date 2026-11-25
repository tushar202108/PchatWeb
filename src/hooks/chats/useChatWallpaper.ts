import { useCallback, useEffect } from "react";

interface Options {
  userId: string;
  wallpaperUrl: string;
  setWallpaperUrl: (url: string) => void;
}

export function useChatWallpaper({ userId, setWallpaperUrl }: Options) {
  useEffect(() => {
    if (!userId) {
      setWallpaperUrl("");
      return;
    }

    try {
      setWallpaperUrl(localStorage.getItem(`pchat_wallpaper_${userId}`) ?? "");
    } catch (error) {
      console.error("Failed to load chat wallpaper:", error);
      setWallpaperUrl("");
    }
  }, [userId, setWallpaperUrl]);

  const handleWallpaperChange = useCallback((url: string) => {
    setWallpaperUrl(url);
    if (!userId) return;

    try {
      const key = `pchat_wallpaper_${userId}`;
      if (url) localStorage.setItem(key, url);
      else localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to save chat wallpaper:", error);
    }
  }, [setWallpaperUrl, userId]);

  return { handleWallpaperChange };
}
