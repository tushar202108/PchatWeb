<div align="center">

# 🔐 pChat (Private Chats)
### **Zero-Database. Real-Time. Cross-Platform Private Messaging.**

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-0078D6?style=for-the-badge&logo=windows&logoColor=white)](#)
[![Encryption](https://img.shields.io/badge/Security-End--to--End%20Encrypted-20C982?style=for-the-badge&logo=letsencrypt&logoColor=white)](#)
[![Zero-DB](https://img.shields.io/badge/Storage-Zero--Database%20Architecture-FF4B4B?style=for-the-badge&logo=databricks&logoColor=white)](#)
[![WebSockets](https://img.shields.io/badge/Protocol-WebSockets-orange?style=for-the-badge&logo=socket.io&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#)

*A high-speed, WhatsApp-style private chat application engineered for secure campus communication and privacy-first users—featuring End-to-End Encryption, strict Zero-Database storage, Gmail OTP signup, one-view ephemeral media, per-chat wallpapers, theme customization, and full group administration.*

[Features](#-features) • [Architecture](#-architecture--how-it-works) • [Security Vision](#-future-security-vision) • [Installation](#-installation)

</div>

---

## ✨ Why pChat?

**pChat (Private Chats)** gives you a familiar, WhatsApp-like messaging experience with full privacy control. Built for **secure campus chat** and privacy-focused teams, pChat enforces a **Zero-Database** model:

* **No message history stored in a database**
* **No pictures, documents, or shared links stored in a database**
* **End-to-End Encryption (E2EE)** so only sender and recipient clients read payloads
* **Real-time WebSocket delivery** across **Windows** and **Linux**

---

## 🚀 Features

### 🔒 Security, Privacy & Zero-Database Architecture
| Feature | Details |
| :--- | :--- |
| 🛡️ **End-to-End Encryption (E2EE)** | Messages, images, documents, and links are encrypted on the sender client and decrypted only on the recipient client. |
| 🚫 **Zero-Database Storage** | Messages, pictures, documents, and links are **never stored in a database**. Data stays on user devices rather than a central database. |
| 📧 **Gmail OTP Authentication** | Sign up and verify user accounts using a One-Time Password (OTP) sent to Gmail. |
| 👁️ **One-View Media & Messages** | Send photos, documents, or messages set to **One-View** so they clear after being viewed once. |
| 🏫 **Secure Campus Chat** | Built for private, low-latency messaging within a campus network or community. |

### 💬 Messaging, Status & Shared Media
| Feature | Details |
| :--- | :--- |
| ⚡ **Real-Time WebSockets** | Instant message delivery and live state synchronization over WebSockets. |
| 🟢 **Online / Offline Status** | Live presence tracking showing when users are online or offline. |
| ✔️ **Read Receipts & Acknowledgements** | Delivery acknowledgements and read receipts so senders know when messages arrive and are read. |
| ↪️ **Forward Message** | Forward messages and shared items across chats and groups. |
| 🗑️ **Delete for Everyone** | Remove sent messages across participants in the conversation. |
| 🖼️ **Media Sharing & Shared Media Gallery** | Share pictures, documents, and links directly in chat, with a **Shared Media Gallery** to browse shared files and media. |

### 👥 Group Management
| Feature | Details |
| :--- | :--- |
| 👨‍👩‍👧‍👦 **Group Creation** | Create group chats for classes, clubs, or project teams. |
| 👑 **Multiple Admins** | Assign multiple group admins to share moderation and group management. |
| 🚫 **Remove Action for Admin** | Admins can remove members from the group. |
| 🚪 **Leave Group** | Members can leave a group at any time. |

### 🎨 Customization & Cross-Platform Support
| Feature | Details |
| :--- | :--- |
| 🖼️ **Conversation-Based Wallpaper & Custom Wallpaper** | Set a **custom wallpaper** per conversation or keep the **default theme**. |
| 🌗 **Theme Customize & Default Theme** | Switch between the **default theme** and customized theme settings. |
| 💻 **Easy to Install (Windows & Linux)** | Simple setup and native compatibility for both **Windows** and **Linux**. |

---

## 🧠 Architecture & How It Works

pChat routes encrypted traffic over WebSockets without persisting messages, pictures, documents, or links in a database.

```text
┌─────────────┐   1. Gmail OTP Auth & E2EE Payload   ┌──────────────────────┐
│  Sender     │ ───────────────────────────────────► │  WebSocket Server    │
│  (Windows / │                                      │                      │
│   Linux)    │ ◄─────────────────────────────────── │  ❌ No DB for msgs   │
└─────────────┘   4. Ack & Read Receipts             │  ❌ No DB for pics,  │
                                                     │     docs, or links   │
                                                     └──────────┬───────────┘
                                                                │
                                        ┌───────────────────────┴───────────────────────┐
                                        ▼ (Recipient Online)                            ▼ (Recipient Offline)
                               ┌─────────────────┐                             ┌─────────────────┐
                               │   Recipient     │                             │  Pending Queue  │
                               │ • E2EE Decrypt  │                             │  (Flushed on    │
                               │ • Shared Media  │                             │   Reconnect)    │
                               │ • One-View      │                             └─────────────────┘
                               └─────────────────┘
