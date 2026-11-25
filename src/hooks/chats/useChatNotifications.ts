import { useEffect } from "react";
import { notificationService } from "../../services/notificationService";

export function useChatNotifications() {
  useEffect(() => {
    notificationService.requestPermission();

    const unlockAudio = () => notificationService.unlockAudio();
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);
}
