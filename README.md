<div align="center">

# 🔐 pChat (Private Chats)
### **Zero-Database. Real-Time. Cross-Platform Private Messaging.**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#)
[![Encryption](https://img.shields.io/badge/Security-End--to--End%20Encrypted-20C982?style=for-the-badge&logo=letsencrypt&logoColor=white)](#)
[![Zero-DB](https://img.shields.io/badge/Storage-Zero--Database%20Architecture-FF4B4B?style=for-the-badge&logo=databricks&logoColor=white)](#)
[![WebSockets](https://img.shields.io/badge/Protocol-WebSockets-orange?style=for-the-badge&logo=socket.io&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

*A high-speed, WhatsApp-style private desktop messaging application engineered for campus networks and privacy-first communities—featuring End-to-End Encryption, zero database persistence, Gmail OTP verification, one-view ephemeral media, and rich group management.*

[Features](#-features) • [Architecture](#-architecture--how-it-works) • [Security Vision](#-future-security-vision) • [Installation](#-installation)

</div>

---

## ✨ Why pChat?

**pChat (Private Chats)** brings the familiar, fluid experience of WhatsApp to your desktop—without sacrificing your digital sovereignty. Built specifically for **secure campus communication** and privacy-conscious users, pChat operates on a strict **Zero-Database policy**. 

Your messages, pictures, documents, and shared links are **never stored on any central server database**. Every payload travels through an encrypted WebSocket tunnel directly between peers, ensuring your private conversations remain strictly yours.

---

## 🚀 Features

### 🔒 Core Security & Zero-Database Privacy
| Feature | Description |
| :--- | :--- |
| 🛡️ **End-to-End Encryption (E2EE)** | Messages, media, and documents are encrypted on the sender's device and decrypted exclusively on the recipient's client. |
| 🚫 **Strict Zero-Database Storage** | **No messages, pictures, documents, or links are ever stored in a database.** Data lives locally on user devices, eliminating server-side data breaches. |
| 📧 **Gmail OTP Authentication** | Secure, passwordless signup and identity verification via instant One-Time Passwords (OTP) delivered directly to your Gmail. |
| 👁️ **One-View Media & Messages** | Send sensitive photos, documents, or text that self-destruct immediately after being viewed once by the recipient. |
| 🏫 **Campus-Ready Security** | Engineered for low-latency, isolated, and secure communication across university and campus networks. |

### 💬 Rich Messaging & Media Experience
| Feature | Description |
| :--- | :--- |
| ⚡ **Real-Time WebSocket Engine** | Instantaneous bidirectional message delivery with live typing and connection state synchronization. |
| ✔️ **Delivery & Read Receipts** | Real-time message acknowledgements (`Sent`, `Delivered`, and `Read` indicators) so you always know when your message is seen. |
| ↪️ **Message Forwarding** | Seamlessly forward encrypted messages, media, and documents across individual chats and groups. |
| 🗑️ **Delete for Everyone** | Instantly revoke and wipe sent messages across all participants' devices. |
| 🖼️ **Media, Docs & Shared Gallery** | Share high-resolution images, documents, and links directly via the socket pipeline, organized neatly in a **Shared Media Gallery** per chat. |
| 🟢 **Live Presence Indicators** | Real-time **Online / Offline** status tracking for every contact. |

### 👥 Advanced Group Management
| Feature | Description |
| :--- | :--- |
| 👨‍👩‍👧‍👦 **Instant Group Creation** | Spin up private encrypted group chats for study groups, campus clubs, or project teams. |
| 👑 **Multiple Group Admins** | Assign multiple administrators to co-manage permissions and moderation. |
| 🚫 **Admin Moderation Controls** | Admins can remove members or manage group membership with instant state updates. |
| 🚪 **Leave Group Anytime** | Cleanly exit any group chat while immediately revoking future group key access. |

### 🎨 Personalization & Cross-Platform Support
| Feature | Description |
| :--- | :--- |
| 🖼️ **Per-Conversation Wallpapers** | Set unique **custom wallpapers** for individual chats or use the sleek **default theme**. |
| 🌗 **Full Theme Customization** | Tailor the interface colors and appearance to match your personal workflow. |
| 🖥️ **Windows & Linux Compatible** | Lightweight, easy-to-install native builds designed to run smoothly on both **Windows** and **Linux**. |

---

## 🧠 Architecture & How It Works

pChat acts strictly as a stateless, encrypted relay router—never a storage vault.

```text
┌─────────────┐   1. Gmail OTP Auth & E2EE Payload   ┌──────────────────────┐
│  Sender     │ ───────────────────────────────────► │  Stateless Relay     │
│  (Windows / │                                      │  (WebSocket Server)  │
│   Linux)    │ ◄─────────────────────────────────── │                      │
└─────────────┘   4. Ack / Read Receipt Sync         │  ❌ Zero Database    │
                                                     │  ❌ No Media Logs    │
                                                     └──────────┬───────────┘
                                                                │
                                        ┌───────────────────────┴───────────────────────┐
                                        ▼ (Recipient Online)                            ▼ (Recipient Offline)
                               ┌─────────────────┐                             ┌─────────────────┐
                               │   Recipient     │                             │  Ephemeral RAM  │
                               │ • Decrypts E2EE │                             │  Delivery Queue │
                               │ • Local Gallery │                             │ (Wiped on Flush)│
                               │ • One-View Wipe │                             └─────────────────┘
                               └─────────────────┘


Identity Verification: Users register using their Gmail address and verify ownership via a time-sensitive OTP.

Client-Side Encryption: Before leaving your Windows or Linux machine, every text, image, document, or link is encrypted locally.

Zero-Persistence Routing: The WebSocket server routes the encrypted packet directly to the recipient (or group members) and immediately discards it from memory—nothing touches a database.

Local-Only State: Chat history, custom wallpapers, and the Shared Media Gallery reside strictly on your local machine.

🔮 Future Security Vision
pChat is continuously evolving toward zero-trust, military-grade privacy:

Perfect Forward Secrecy (Double Ratchet Protocol): Rotating ephemeral encryption keys per message so past communications remain secure even if a device key is ever compromised.

Peer-to-Peer (WebRTC) Direct Data Channels: Bypassing relay servers entirely on local campus LANs for direct device-to-device file and media transfers.

Screenshot & Screen-Capture Protection: OS-level window protection to block screenshots on One-View media and confidential chats.

Zero-Knowledge Encrypted Local Backups: Optional password-protected, user-owned local archive exports without cloud exposure.

Stealth / Disappearing Chat Timers: Configurable auto-expiry timers (e.g., 5m, 1h, 24h) for entire conversations.

💻 Installation
pChat is built for hassle-free setup with zero external database dependencies required on your machine.

Prerequisites
OS: Windows 10/11 (64-bit) or Linux (Ubuntu, Debian, Fedora, Arch)

Internet / Campus LAN Access (for Gmail OTP verification and WebSocket relay)

Quick Start
# 1. Clone the repository
git clone [https://github.com/yourusername/pChat.git](https://github.com/yourusername/pChat.git)
cd pChat

# 2. Install dependencies
npm install

# 3. Configure environment variables (Gmail SMTP for OTP & Relay Port)
cp .env.example .env

# 4. Run the application
npm start
Native Installers (Windows & Linux)
Windows: Download pChat-Setup.exe from the Releases page and run the one-click installer.

Linux: Download pChat.AppImage or pChat.deb:

Bash
chmod +x pChat.AppImage
./pChat.AppImage
📄 License
Distributed under the MIT License. Built for private, unrestricted, and secure communication.
