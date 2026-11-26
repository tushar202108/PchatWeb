
import { useCallback, useEffect } from "react";

interface Options {
  userId: string;
  conversationId: string;
  wallpaperUrl: string;
  setWallpaperUrl: (url: string) => void;
}

export function useChatWallpaper({
  userId,
  conversationId,
  setWallpaperUrl,
}: Options) {
  useEffect(() => {
    let active = true;

    const loadWallpaper = async () => {
      if (!userId || !conversationId) {
        setWallpaperUrl("");
        return;
      }

      try {
        const settings =
          await window.wallpaperStorage.getSettings();

        const wallpaperId =
          settings.conversations?.[conversationId] ||
          settings.all ||
          "";

        if (!wallpaperId) {
          if (active) setWallpaperUrl("");
          return;
        }

        const url =
          await window.wallpaperStorage.read(wallpaperId);

        if (active) {
          setWallpaperUrl(url);
        }
      } catch (error) {
        console.error("Failed to load chat wallpaper:", error);

        if (active) {
          setWallpaperUrl("");
        }
      }
    };

    void loadWallpaper();

    return () => {
      active = false;
    };
  }, [userId, conversationId, setWallpaperUrl]);

  const handleWallpaperChange = useCallback(
    (url: string) => {
      setWallpaperUrl(url);
    },
    [setWallpaperUrl]
  );

  return { handleWallpaperChange };
}
