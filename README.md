<div align="center">

# 🔐 pChat
### **Zero-Knowledge. Real-Time. Cross-Platform Messaging.**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#)
[![Encryption](https://img.shields.io/badge/Security-End--to--End%20Encrypted-20C982?style=for-the-badge&logo=letsencrypt&logoColor=white)](#)
[![WebSockets](https://img.shields.io/badge/Protocol-WebSockets-orange?style=for-the-badge&logo=socket.io&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

*A high-speed, privacy-first desktop chat application engineered with End-to-End Encryption, live presence tracking, fault-tolerant offline message queuing, and instant media delivery.*

[Features](#-features) • [Architecture](#-architecture--how-it-works) • [Installation](#-installation) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Why pChat?

Most modern chat applications compromise privacy for convenience—or sacrifice speed for security. **pChat** delivers both. Built from the ground up with a sleek, distraction-free interface and persistent WebSocket architecture, every text, image, and profile update travels securely between peers without ever exposing plaintext data to intermediaries.

---

## 🚀 Features

| Feature | Description |
| :--- | :--- |
| 🔒 **End-to-End Encryption (E2EE)** | Messages and media payloads are encrypted on the sender's device and decrypted exclusively on the recipient's client. |
| ⚡ **Real-Time WebSocket Engine** | Ultra-low-latency bidirectional communication for instantaneous message dispatch and state synchronization. |
| 📬 **Smart Offline Message Queue** | Recipient offline? No problem. Encrypted payloads are held safely in a server-side dispatch queue and flushed automatically the millisecond they reconnect. |
| 🟢 **Live Presence Indicators** | Real-time **Online / Offline** status tracking across all active user sessions. |
| 🖼️ **Rich Media & Image Sharing** | Send high-resolution images and attachments directly through the socket pipeline with crisp inline previews. |
| 👤 **Custom Identity & Avatars** | Personalize your profile with custom usernames and synced profile pictures across your contact list. |
| 🖥️ **Native Desktop Builds** | Dedicated builds tailored for both **Windows** and **Linux** environments. |

---

## 🧠 Architecture & How It Works

```text
┌─────────────┐         Encrypted Payload          ┌──────────────────┐
│  Sender     │ ─────────────────────────────────► │ WebSocket Server │
│  (Online)   │                                    │                  │
└─────────────┘                                    │  ┌────────────┐  │
                                                   │  │ Is Target  │  │
                                                   │  │  Online?   │  │
                                                   │  └─────┬──────┘  │
                                                   └────────┼─────────┘
                                                            │
                                    ┌───────────────────────┴───────────────────────┐
                                    ▼ (YES: Instant Push)                           ▼ (NO: Hold in Queue)
                           ┌─────────────────┐                             ┌─────────────────┐
                           │   Recipient     │                             │  Offline Queue  │
                           │ (Instant Read)  │                             │ (Auto-Flush on  │
                           └─────────────────┘                             │   Reconnect)    │
                                                                           └─────────────────┘
