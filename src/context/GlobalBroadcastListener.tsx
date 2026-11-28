import { useEffect } from "react";
import { useWebSocket } from "./WebSocketContext";
import { ProfileImage } from "../services/ProfileImageService";

export default function GlobalBroadcastListener() {
  const { connected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe(
      "/user/topic/broadcast",
      async (message) => {
        try {
          const broadcast = JSON.parse(message.body);

          // Handle profile picture updates
          if (broadcast.message === "profileUpdated" && broadcast.userId) {
            const userId = String(broadcast.userId);

            // Remove old cached image
            ProfileImage.clearProfileImage(userId);

            // Fetch latest profile picture
            await ProfileImage.refreshProfileImage(userId);

            console.log("Profile image refreshed for:", userId);
          }

          window.dispatchEvent(
            new CustomEvent("app-broadcast", {
              detail: broadcast,
            })
          );
        } catch (error) {
          console.error("Broadcast handling error:", error);
        }
      }
    );

    return unsubscribe;
  }, [connected, subscribe]);

  return null;
}