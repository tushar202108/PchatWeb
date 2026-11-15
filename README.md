# 💬 pChat

> A secure, modern, and lightning-fast cross-platform desktop messaging application featuring end-to-end encryption (E2EE), real-time WebSocket communication, offline message queuing, and seamless media sharing.

---

## 🌟 Key Features

*   🔒 **End-to-End Encryption (E2EE):** Your messages and media are securely encrypted, ensuring that only you and your intended recipient can read them.
*   📡 **Real-Time WebSockets:** Instant message delivery, typing indicators, and live updates powered by a robust WebSocket server architecture.
*   📬 **Offline Message Queuing:** If a recipient is offline, messages are securely held in a queue and automatically delivered the moment they reconnect.
*   🟢 **Online & Offline Status:** Real-time presence tracking so you always know when your contacts are active.
*   🖼️ **Media & File Sharing:** Send and receive profile pictures, high-resolution images, and documents directly through the app interface.
*   👤 **Custom Profiles:** Set and update your unique username and profile avatar seamlessly.
*   🖥️ **Cross-Platform Support:** Built natively for **Windows** and **Linux** desktop environments.

---

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite, Modern CSS / Glassmorphism UI
*   **Communication:** WebSockets (`ws` / `socket.io`)
*   **Storage:** Client-side secure storage & persistent queuing
*   **Desktop Bundling:** Electron / Cross-platform binary compilation

---

## 📋 System Requirements & Prerequisites

### For Linux Users
Because the Linux desktop build is packaged as an AppImage or standalone binary, it relies on **FUSE (Filesystem in Userspace) version 2** to mount and execute properly. 

Ensure `libfuse2` is installed on your Linux distribution before running the application:

*   **Ubuntu / Debian / Mint:**
    ```bash
    sudo apt update
    sudo apt install libfuse2
    ```
*   **Fedora / RHEL / CentOS:**
    ```bash
    sudo dnf install fuse
    ```
*   **Arch Linux:**
    ```bash
    sudo pacman -S fuse2
    ```

### For Windows Users
*   Windows 10 or Windows 11 (64-bit)
*   No special dependencies required.

---

## 🚀 Installation & Getting Started

### 1. Download & Setup
Clone the repository or download the latest release binary for your operating system from the [Releases page](#).

```bash
git clone [https://github.com/your-username/pChat.git](https://github.com/your-username/pChat.git)
cd pChat
