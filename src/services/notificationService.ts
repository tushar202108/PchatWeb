
const notificationAudio = new Audio("/public/Notification.wav");

notificationAudio.preload = "auto";
notificationAudio.volume = 0.6;

export const notificationService = {
    unlockAudio() {
        // Start and immediately pause to unlock browser audio.
        notificationAudio.play()
            .then(() => {
                notificationAudio.pause();
                notificationAudio.currentTime = 0;
            })
            .catch((error) => {
                console.warn("Audio unlock failed:", error);
            });
    },

    async requestPermission() {
        if (!("Notification" in window)) return;

        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }
    },

    async playMessageSound() {
        try {
            notificationAudio.pause();
            notificationAudio.currentTime = 0;
            await notificationAudio.play();
        } catch (error) {
            console.warn("Unable to play notification sound:", error);
        }
    },

    showNotification(title: string, body: string) {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        if (
            document.visibilityState === "visible" &&
            document.hasFocus()
        ) {
            return;
        }

        const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: "pchat-incoming-message",
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    },

    notifyIncomingMessage(senderName: string, message: string) {
        void this.playMessageSound();
        this.showNotification(senderName || "New message", message);
    },
};
