
const notificationAudio = new Audio(
  `${import.meta.env.BASE_URL}Notification.wav`
);

notificationAudio.preload = "auto";
notificationAudio.volume = 0.6;

export const notificationService = {
  /**
   * Request browser notification permission.
   */
  async requestPermission(): Promise<void> {
    if (!("Notification" in window)) {
      console.warn("Desktop notifications are not supported.");
      return;
    }

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn("Notification permission request failed:", error);
      }
    }
  },

  /**
   * Unlock audio after the user's first interaction.
   */
  unlockAudio(): void {
    notificationAudio
      .play()
      .then(() => {
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
      })
      .catch((error) => {
        console.warn("Audio unlock failed:", error);
      });
  },

  /**
   * Play incoming message sound.
   */
  async playMessageSound(): Promise<void> {
    try {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;

      await notificationAudio.play();
    } catch (error) {
      console.warn("Unable to play notification sound:", error);
    }
  },

  /**
   * Display desktop notification.
   */
  showNotification(
    title: string,
    body: string
  ): void {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    // Don't show desktop notification when app is active.
    if (
      document.visibilityState === "visible" &&
      document.hasFocus()
    ) {
      return;
    }

    const notification = new Notification(title || "pChats", {
      body,
      icon: `${import.meta.env.BASE_URL}favicon.ico`,
      tag: "pchat-incoming-message",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  },

  /**
   * Handle incoming message notification and sound.
   */
  notifyIncomingMessage(
    senderName: string,
    message: string
  ): void {
    void this.playMessageSound();

    this.showNotification(
      senderName || "New message",
      message || "You received a new message"
    );
  },
};
