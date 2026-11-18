import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { FormEvent } from "react";
import {
  Avatar,
  Button,
  Input,
  Layout,
  List,
  Typography,
  Space,
  Modal,
  Dropdown
} from "antd";
import { message as antdMessage } from "antd";
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  SmileOutlined,
  TeamOutlined,
  SearchOutlined,
  ContainerOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { useAuth } from "../context/authContext";
import sys from "../constant/navigation.json";
import NewChatModal from "../components/NewChatModal";
import type { NewChatContact } from "../types/NewChatModal.types";
import { localChatService } from "../services/localChatService";
import ProfileMenu from "../components/ProfileMenu";
import type {
  ProfileMenuAction,
  ProfileStatus,
} from "../components/ProfileMenu";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext";
import "../index.css"
import { useChatSocket } from "../hooks/useChatSocket";
import CreateGroupModal from "../components/CreateGroupModal";
import type {
  LocalChatMessage,
  LocalConversation,
} from "../DataStorage/chatStorage";
import { EMPTY_TEXT, MIN_GROUP_MEMBERS, SIDEBAR_TABS, type ChatMessage, type Conversation, type IncomingChatMessage, type SidebarTab } from "../types/chats.type";
import { tokenStore } from "../Axios/axiosService";
import AttachmentPicker from "../components/AttachmentPicker";
import MessageAttachment from "../components/MessageAttachment";
import { chatService } from "../services/chatService";
import "../index.css"


const { Sider, Content } = Layout;
const { Text, Title } = Typography;
export default function ChatPage() {
  const { user, signOut } = useAuth();
  const { connected, publish, subscribe } = useWebSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [contacts, setContacts] = useState<NewChatContact[]>([]);
  const [draft, setDraft] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");
  const [localDataLoaded, setLocalDataLoaded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [existingOnlineUsers, setExistingOnlineUsers] = useState<string[]>([]);
  const userId = String(user?.id ?? "");
  const [profileStatus, setProfileStatus] =
    useState<ProfileStatus>("available");
  const conversationsRef = useRef(conversations);
  const selectedRef = useRef(selected);

  conversationsRef.current = conversations;
  selectedRef.current = selected;
  const messages = selected ? (messagesByConversation[selected.id] ?? []) : [];
  const visibleConversations = conversations.filter((conversation) => {
    const query = sidebarQuery.trim().toLowerCase();


    if (query && !conversation.name.toLowerCase().includes(query)) {
      return false;
    }

    if (sidebarTab === "archived") {
      return Boolean(conversation.archived);
    }

    if (conversation.archived) {
      return false;
    }

    if (sidebarTab === "unread") {
      return (conversation.unread ?? 0) > 0;
    }

    return true;
  });
  const unreadTotal = conversations.filter(
    (conversation) => !conversation.archived && (conversation.unread ?? 0) > 0,
  ).length;

  const toggleArchive = (id: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, archived: !conversation.archived }
          : conversation,
      ),
    );
  };
  const handleDeleteConversation = (conversation: Conversation) => {
    Modal.confirm({
      title: "Delete conversation?",
      content: `Are you sure to delete this conversation ?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await localChatService.deleteConversation(
            userId,
            conversation.id
          );

          setConversations((current) =>
            current.filter((item) => item.id !== conversation.id)
          );

          setMessagesByConversation((current) => {
            const updated = { ...current };
            delete updated[conversation.id];
            return updated;
          });

          if (selected?.id === conversation.id) {
            setSelected(null);
            setMobileView("sidebar");
          }
        } catch (error) {
          console.error("Failed to delete conversation:", error);
        }
      },
    });
  };



  const handleDeleteMessage = (chatMessage: ChatMessage) => {
    if (!selected) {
      console.error("No conversation selected");
      return;
    }

    Modal.confirm({
      title: "Delete message?",
      content: "Are you sure delete this message ?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => {
        try {
          console.log("Deleting message:", {
            userId,
            conversationId: selected.id,
            messageId: chatMessage.id,
          });

          // Delete from Electron SQLite
          const result = await localChatService.deleteMessage(
            userId,
            selected.id,
            String(chatMessage.id)
          );

          console.log("SQLite delete result:", result);
          setMessagesByConversation((current) => ({
            ...current,
            [selected.id]: (current[selected.id] ?? []).filter(
              (item) => String(item.id) !== String(chatMessage.id)
            ),
          }));
          setConversations((current) =>
            current.map((conversation) => {
              if (conversation.id !== selected.id) {
                return conversation;
              }

              const remaining = (
                messagesByConversation[selected.id] ?? []
              ).filter(
                (item) => String(item.id) !== String(chatMessage.id)
              );

              return {
                ...conversation,
                lastMessage: remaining.length
                  ? remaining[remaining.length - 1].text
                  : "",
              };
            })
          );

          antdMessage.success("Message deleted successfully");
        } catch (error) {
          console.error("Delete message failed:", error);
          antdMessage.error("Unable to delete message");
        }
      },
    });
  };

  const publishReadAcknowledgement = useCallback(
    (messageIds: string[], status: "DELIVERED" | "READ") => {
      if (!connected || !messageIds.length) return;

      const payload = messageIds.map((messageId) => ({
        messageId,
        status,
        readerId: String(user?.email ?? ""),
      }));

      console.log(`Publishing ${status} acknowledgement:`, payload);

      publish("/app/messages.ack", payload);
    },
    [connected, publish, user?.email]
  );


  const handleIncomingMessage = useCallback(
    (received: IncomingChatMessage) => {
      console.log("Received WebSocket message:", received);

      const senderId = String(received.senderId ?? "").trim();
      const messageId = String(received.messageId ?? "").trim();

      if (!senderId || !messageId) {
        console.warn("Incoming message missing senderId/messageId:", received);
        return;
      }

      if (
        senderId.toLowerCase() ===
        String(user?.email ?? "").trim().toLowerCase()
      ) {
        return;
      }

      const existingConversation = conversationsRef.current.find(
        (item) =>
          String(item.username ?? "").trim().toLowerCase() ===
          senderId.toLowerCase() ||
          String(item.id).toLowerCase() === senderId.toLowerCase()
      );

      const conversation: Conversation = existingConversation ?? {
        id: `incoming-${senderId.toLowerCase()}`,
        name: received.senderName || senderId,
        username: senderId,
        lastMessage: "",
        unread: 0,
      };

      const conversationId = conversation.id;
      const isConversationOpen =
        selectedRef.current?.id === conversationId;

      const incomingMessage: ChatMessage = {
        id: messageId,
        text: received.content ?? "",
        mine: false,
        senderName: received.senderName || conversation.name,
        status: isConversationOpen ? "read" : "delivered",
      };

      setMessagesByConversation((current) => {
        const existingMessages = current[conversationId] ?? [];

        if (
          existingMessages.some(
            (item) => String(item.id) === messageId
          )
        ) {
          return current;
        }

        return {
          ...current,
          [conversationId]: [
            ...existingMessages,
            incomingMessage,
          ],
        };
      });

      setConversations((current) => {
        const exists = current.some(
          (item) => item.id === conversationId
        );

        if (exists) {
          return current.map((item) =>
            item.id === conversationId
              ? {
                ...item,
                lastMessage: received.content ?? "",
                unread: isConversationOpen
                  ? item.unread ?? 0
                  : (item.unread ?? 0) + 1,
              }
              : item
          );
        }

        return [
          {
            ...conversation,
            lastMessage: received.content ?? "",
            unread: isConversationOpen ? 0 : 1,
          },
          ...current,
        ];
      });
      if (connected) {
        publishReadAcknowledgement([messageId], "DELIVERED");
      }
      // If the receiver is already viewing this conversation,
      // acknowledge this newly received message as READ.
      if (isConversationOpen && connected) {
        publishReadAcknowledgement([messageId], "READ");
      }
    },
    [user?.email, connected, publish,publishReadAcknowledgement]
  );
  const handleUserStatus = useCallback((status: any) => {
    console.log("Live user status:", status);

    const recipientId = String(
      status.recipientId ?? status.userId ?? ""
    ).trim().toLowerCase();

    if (!recipientId) return;

    const isOnline =
      status.online === true ||
      String(status.status).toUpperCase() === "ONLINE";

    setOnlineUsers((current) => {
      if (isOnline) {
        return current.includes(recipientId)
          ? current
          : [...current, recipientId];
      }

      return current.filter((id) => id !== recipientId);
    });
  }, []);



  const handleExistingUserStatus = useCallback((members: string[]) => {
    console.log("Initial online members:", members);

    if (!Array.isArray(members)) {
      console.warn("Expected an array of online users:", members);
      return;
    }

    const normalizedUsers = members
      .map((id) => String(id).trim().toLowerCase())
      .filter(Boolean);

    setExistingOnlineUsers(normalizedUsers);
    setOnlineUsers(normalizedUsers);
  }, []);


  // const handleUserAcknowledge = useCallback((ack: any) => {
  //   console.log("Message acknowledgement:", ack);

  //   const messageIds: string[] = (
  //     ack.messageIds ??
  //     (ack.messageId ? [ack.messageId] : [])
  //   ).map(String);

  //   if (!messageIds.length) return;

  //   const ackStatus = String(ack.status ?? "").toUpperCase();

  //   const newStatus =
  //     ackStatus === "READ"
  //       ? "read"
  //       : ackStatus === "DELIVERED"
  //         ? "delivered"
  //         : null;

  //   if (!newStatus) return;

  //   setMessagesByConversation((current) => {
  //     const updated = { ...current };

  //     Object.keys(updated).forEach((conversationId) => {
  //       updated[conversationId] = updated[conversationId].map(
  //         (message) => {
  //           if (
  //             !message.mine ||
  //             !messageIds.includes(String(message.id))
  //           ) {
  //             return message;
  //           }

  //           // Never downgrade a read message.
  //           if (message.status === "read") return message;

  //           return {
  //             ...message,
  //             status: newStatus,
  //           };
  //         }
  //       );
  //     });

  //     return updated;
  //   });
  // }, []);


  const handleUserAcknowledge = useCallback((ack: any) => {
  console.log("Message acknowledgement:", ack);

  const acknowledgements = Array.isArray(ack) ? ack : [ack];

  const statusMap = new Map<string, "delivered" | "read">();

  acknowledgements.forEach((item) => {
    const status = String(item.status ?? "").toUpperCase();

    const newStatus =
      status === "READ"
        ? "read"
        : status === "DELIVERED"
          ? "delivered"
          : null;

    if (!newStatus) return;

    const ids = item.messageIds ??
      (item.messageId ? [item.messageId] : []);

    ids.forEach((id: string) => {
      statusMap.set(String(id), newStatus);
    });
  });

  if (!statusMap.size) return;

  setMessagesByConversation((current) => {
    const updated = { ...current };

    Object.keys(updated).forEach((conversationId) => {
      updated[conversationId] = updated[conversationId].map(
        (message) => {
          if (!message.mine) return message;

          const newStatus = statusMap.get(String(message.id));

          if (!newStatus) return message;

          // Never downgrade READ to DELIVERED.
          if (message.status === "read") return message;

          return {
            ...message,
            status: newStatus,
          };
        }
      );
    });

    return updated;
  });
}, []);





  const sendReadAcknowledgement = useCallback(
    (conversationId: string) => {
      const conversationMessages =
        messagesByConversation[conversationId] ?? [];

      const unreadMessages = conversationMessages.filter(
        (message) => !message.mine && message.status !== "read"
      );

      const unreadMessageIds = unreadMessages
        .map((message) => String(message.id))
        .filter(Boolean);

     if (!unreadMessageIds.length) return;

    if (connected) {
      publishReadAcknowledgement(unreadMessageIds, "READ");
    }


      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map(
          (message) =>
            !message.mine
              ? { ...message, status: "read" }
              : message
        ),
      }));

      console.log("Read message IDs:", unreadMessageIds);
    },
    [
      messagesByConversation,
      connected,
      publishReadAcknowledgement,
    ]
  );
  useChatSocket({
    connected,
    localDataLoaded,
    subscribe,
    onIncomingMessage: handleIncomingMessage,
    onUserStatus: handleUserStatus,
    existingOnlineUser: handleExistingUserStatus,
    userAcknowledge: handleUserAcknowledge,
  });

  const conversationImages = useMemo(() => {
    const conversationMessages =
      messagesByConversation[selected?.id ?? ""] ?? [];

    return conversationMessages
      .flatMap((message) => message.attachments ?? [])
      .filter((file) => {
        const type = file.type ?? "";
        const name = file.name ?? "";

        return (
          type.startsWith("image/") ||
          /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
        );
      });
  }, [messagesByConversation, selected?.id]);

  const sendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const text = draft.trim();

    if ((!text && attachments.length === 0) || !selected) {
      return;
    }
    try {
      let uploadedAttachments: any[] = [];

      if (attachments.length > 0) {
        uploadedAttachments = await Promise.all(
          attachments.map((file) =>
            chatService.sendAttachment(
              String(selected.username),
              file
            )
          )
        );
      }

      const savedAttachments = await Promise.all(
        attachments.map(async (file) => {
          return window.chatStorage.saveAttachment({
            userId: String(user?.email ?? ""),
            conversationId: String(selected.id),
            name: file.name,
            type: file.type,
            bytes: new Uint8Array(await file.arrayBuffer()),
          });
        })
      );
      const messageId = crypto.randomUUID();
      const newMessage: ChatMessage = {
        id: messageId,
        text,
        mine: true,
        status: "sent",
        attachments: savedAttachments,
      };

      const payload = {
        messageId: messageId,
        senderId: String(user?.email),
        receiverId: selected.username,
        content: text,
        messageType: attachments.length > 0 ? "ATTACHMENT" : "TEXT",
        attachments: uploadedAttachments,
      };

      publish("/app/chat.send", payload);

      setMessagesByConversation((current) => ({
        ...current,
        [selected.id]: [
          ...(current[selected.id] ?? []),
          newMessage,
        ],
      }));

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selected.id
            ? {
              ...conversation,
              lastMessage:
                text ||
                `📎 ${attachments.length} attachment(s)`,
            }
            : conversation
        )
      );

      setDraft("");
      setAttachments([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send message or attachment:", error);
    }
  };


  const handleSelectConversation = (item: Conversation) => {
    console.log("UserSelectedItems", item)
    setSelected(item);
    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);
    setMobileView("chat");
    sendReadAcknowledgement(item.id);
    if ((item.unread ?? 0) > 0) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === item.id
            ? { ...conversation, unread: 0 }
            : conversation,
        ),
      );
    }
  };

  const handleNewChatSelect = (contact: NewChatContact) => {

    const existing = conversations.find(
      (conversation) =>
        conversation.id === contact.id ||
        String(conversation.username ?? "").toLowerCase() ===
        String(contact.subtitle ?? "").toLowerCase()

    );
    if (existing) {
      if (existing.archived) {
        toggleArchive(existing.id);
      }
      handleSelectConversation(existing);
    } else {
      const newConversation: Conversation = {

        id: contact.id,
        name: contact.name,
        lastMessage: "",
        username: contact.subtitle,
      };

      setConversations((current) => [newConversation, ...current]);

      setMessagesByConversation((current) => ({
        ...current,
        [contact.id]: current[contact.id] ?? [],
      }));

      setSidebarTab("all");
      setSidebarQuery("");

      handleSelectConversation(newConversation);
    }

    setNewChatVisible(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setDraft((current) => current + emojiData.emoji);
  };

  const handleCreateGroup = () => {
    const name = groupName.trim();

    if (!name || groupMembers.length < MIN_GROUP_MEMBERS) {
      return;
    }

    const groupId = `group-${Date.now()}`;

    const newGroup: Conversation = {
      id: groupId,
      name,
      lastMessage: "Group created",
    };

    setConversations((current) => [newGroup, ...current]);

    setMessagesByConversation((current) => ({
      ...current,
      [groupId]: [],
    }));

    setSelected(newGroup);
    setMobileView("chat");

    setSidebarTab("all");
    setSidebarQuery("");

    setGroupName("");
    setGroupMembers([]);
    setCreateGroupVisible(false);
  };

  const handleProfileAction = async (action: ProfileMenuAction) => {
    console.log("ActionInHandleProfile", action)
    switch (action) {
      case "profile":
        console.log("Before:", window.location.pathname);

        navigate("/complete-profile");

        setTimeout(() => {
          console.log("After:", window.location.pathname);
        }, 100);

        break;
      case "settings":
      case "privacy":
        break;
      case "logout":
        try {
          const refreshToken = localStorage.getItem("app_refresh_token");

          await signOut({
            refreshToken: refreshToken ?? "",
          });
        } catch (error) {
          console.error("Failed to sign out cleanly:", error);
        } finally {
          tokenStore.clear();
          navigate("/signin", { replace: true });
        }
        break;
    }
  };
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadLocalChatData = async () => {
      setLocalDataLoaded(false);

      try {
        const [savedConversations, savedMessages] = await Promise.all([
          localChatService.getConversations(userId),
          localChatService.getAllMessages(userId),
        ]);

        if (cancelled) return;

        setConversations(
          savedConversations.map((conversation) => ({
            id: conversation.id,
            name: conversation.name,
            lastMessage: conversation.lastMessage,
            unread: conversation.unread,
            archived: conversation.archived,
            username: conversation.username,
          }))
        );

        const groupedMessages: Record<string, ChatMessage[]> = {};

        savedMessages.forEach((message) => {
          if (!groupedMessages[message.conversationId]) {
            groupedMessages[message.conversationId] = [];
          }

          groupedMessages[message.conversationId].push({
            id: message.id,
            text: message.text,
            mine: message.mine,
            senderName: message.senderName,
            attachments: message.attachments,
          });
        });

        Object.values(groupedMessages).forEach((items) => {
          items.sort((a, b) => Number(a.id) - Number(b.id));
        });

        setMessagesByConversation(groupedMessages);
      } catch (error) {
        console.error("Failed to load local chat data:", error);
      } finally {
        if (!cancelled) {
          setLocalDataLoaded(true);
        }
      }
    };

    loadLocalChatData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !localDataLoaded) return;

    const saveConversations = async () => {
      try {
        const localConversations: LocalConversation[] =
          conversations.map((conversation) => ({
            ...conversation,
            userId,
            updatedAt: Date.now(),
          }));

        await localChatService.saveConversations(
          userId,
          localConversations
        );
      } catch (error) {
        console.error("Failed to save conversations:", error);
      }
    };

    saveConversations();
  }, [conversations, userId, localDataLoaded]);
  useEffect(() => {
    if (!userId || !localDataLoaded) return;

    const saveMessages = async () => {
      try {
        const localMessages: LocalChatMessage[] = [];

        Object.entries(messagesByConversation).forEach(
          ([conversationId, messages]) => {
            messages.forEach((message) => {
              localMessages.push({
                id: String(message.id),
                userId,
                conversationId: String(conversationId),
                senderId: userId,
                text: message.text,
                mine: message.mine,
                senderName: message.senderName,
                attachments: message.attachments,
                createdAt: Date.now(),
              });
            });
          }
        );

        await localChatService.saveMessages(userId, localMessages);
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    };

    saveMessages();
  }, [messagesByConversation, userId, localDataLoaded]);

  console.log("contactsChatPage", existingOnlineUsers)
  return (
    <div className="app-shell">
      <Layout
        className={`chat-layout ${mobileView === "chat" ? "show-chat" : "show-chat"
          }`}
      >

        <Sider
          width={340}
          className="chat-sidebar"
          breakpoint="md"
          collapsedWidth={0}
        >
          <div
            className="sidebar-header"
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            <ProfileMenu
              name={user?.name || user?.email || ""}
              email={user?.email}
              status={profileStatus}
              onStatusChange={setProfileStatus}
              onAction={handleProfileAction}
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  cursor: "pointer",
                }}
              >
                <Avatar src={user?.profileImage} icon={<UserOutlined />} />
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    height: "9px",
                    width: "9px",
                    borderRadius: "50%",
                    backgroundColor: connected ? "#10B981" : "#9CA3AF",
                    border: "2px solid #ffffff",
                  }}
                />
              </div>
            </ProfileMenu>

            <div className="sidebar-user">
              <Text strong>{user?.name || user?.email}</Text>
            </div>

            <Space size={4} className="sidebar-header-actions">
              <Button
                type="text"
                icon={<PlusOutlined />}
                title="New Chat"
                onClick={() => setNewChatVisible(true)}
              />

              <Button
                type="text"
                icon={<EditOutlined />}
                title="Create Group"
                onClick={() => setCreateGroupVisible(true)}
              />

              <CreateGroupModal
                open={createGroupVisible}
                conversations={contacts.map((contact) => ({
                  id: contact.id,
                  name: contact.name,
                }))}
                onClose={() => setCreateGroupVisible(false)}
                onCreate={handleCreateGroup}
              />
            </Space>
          </div>

          <div className="sidebar-filters">
            <Input
              className="sidebar-search"
              prefix={<SearchOutlined />}
              placeholder="Search conversations"
              value={sidebarQuery}
              onChange={(event) => setSidebarQuery(event.target.value)}
              allowClear
            />

            <div className="sidebar-tabs" role="tablist">
              {SIDEBAR_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={sidebarTab === tab.key}
                  className={`sidebar-tab ${sidebarTab === tab.key ? "active" : ""
                    }`}
                  onClick={() => setSidebarTab(tab.key)}
                >
                  {tab.label}
                  {tab.key === "unread" && unreadTotal > 0 && (
                    <span className="sidebar-tab-count">{unreadTotal}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <List
            dataSource={visibleConversations}
            locale={{
              emptyText: sidebarQuery.trim()
                ? "No matching conversations"
                : EMPTY_TEXT[sidebarTab],
            }}
            renderItem={(item) => (
              <Dropdown
                trigger={["contextMenu"]}
                overlayClassName="stylish-dropdown-overlay"
                menu={{
                  style: {
                    background: "linear-gradient(135deg, rgb(30, 30, 47) 0%, rgb(8 73 84) 100%)",
                    padding: "4px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  },
                  items: [
                    {
                      key: "delete",
                      label: "Delete conversation",
                      danger: true,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === "delete") {
                      handleDeleteConversation(item);
                    }
                  },
                }}
              >
                <div style={{ width: "100%" }}>
                  <List.Item
                    className={`conversation-item ${selected?.id === item.id ? "selected" : ""
                      }`}
                    onClick={() => handleSelectConversation(item)}
                    actions={[
                      <div key="meta" className="conversation-side">
                        {(item.unread ?? 0) > 0 && (
                          <span className="conversation-unread">{item.unread}</span>
                        )}
                        <Button
                          type="text"
                          size="small"
                          className="conversation-archive-btn"
                          icon={
                            item.archived ? (
                              <RollbackOutlined />
                            ) : (
                              <ContainerOutlined />
                            )
                          }
                          title={item.archived ? "Unarchive" : "Archive"}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleArchive(item.id);
                          }}
                        />

                      </div>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={
                            item.id.startsWith("group-") ? (
                              <TeamOutlined />
                            ) : (
                              <UserOutlined />
                            )
                          }
                        />
                      }
                      title={item.name}
                      description={item.lastMessage}
                    />
                  </List.Item>
                </div>
              </Dropdown>
            )}
          />
        </Sider>

        <Content className="chat-content">
          {selected ? (
            <>
              <div className="chat-header">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  className="mobile-back-btn"
                  onClick={() => setMobileView("sidebar")}
                />

                <Avatar
                  icon={
                    selected.id.startsWith("group-") ? (
                      <TeamOutlined />
                    ) : (
                      <UserOutlined />
                    )
                  }
                />

                <div className="user-status-container">
                  <div className="user-info">
                    <span className="selected-user-name">
                      {selected?.name}
                    </span>

                    {selected && (
                      onlineUsers.includes(
                        String(selected.username ?? "").trim().toLowerCase()
                      ) ? (
                        <span className="online-status">
                          <span className="status-dot online-dot" />
                          Online
                        </span>
                      ) : (
                        <span className="offline-status">
                          <span className="status-dot offline-dot" />
                          Offline
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>


              <div className="message-list">
                {messages.length === 0 ? (
                  <Text type="secondary">{sys.sys.chat.noMessages}</Text>
                ) : (
                  messages.map((message) => (
                    console.log("messageStatus", message.status),
                    <Dropdown
                      key={message.id}
                      trigger={["contextMenu"]}
                      menu={{
                        style: {
                          background: "linear-gradient(135deg, rgb(30, 30, 47) 0%, rgb(8 73 84) 100%)",
                          padding: "4px",
                          borderRadius: "12px",
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                        items: [
                          {
                            key: "delete",
                            label: "Delete message",
                            danger: true,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === "delete") {
                            handleDeleteMessage(message);
                          }
                        },
                      }}
                    >
                      <div
                        className={`message-bubble ${message.mine ? "mine" : "theirs"
                          }`}
                      >
                        {message.text && <div>{message.text}</div>}
                        {message.mine && (
                          <span
                            className={`message-ticks ${message.status ?? "sent"}`}
                            title={
                              message.status === "read"
                                ? "Read"
                                : message.status === "delivered"
                                  ? "Delivered"
                                  : "Sent"
                            }
                          >
                            {message.status === "sent" ? "✓" : "✓✓"}
                          </span>
                        )}
                        {message.attachments?.map((file, index) => (
                          <MessageAttachment
                            key={file.id || `${file.name}-${index}`}
                            file={file}
                            attachments={conversationImages}
                          />
                        ))}
                      </div>
                    </Dropdown>
                  ))
                )}
              </div>


              <div className="message-composer" style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
              }}>
                {showEmojiPicker && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      right: 0,
                      zIndex: 1000,
                    }}
                  >
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
                <AttachmentPicker

                  files={attachments}
                  onChange={setAttachments}
                />

                <Button
                  type="text"
                  icon={<SmileOutlined />}
                  title="Choose emoji"
                  style={{ color: "#fff" }}
                  onClick={() => setShowEmojiPicker((current) => !current)}
                />

                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={sys.sys.chat.messagePlaceholder}
                />

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => sendMessage()}
                  style={{
                    backgroundColor: "#0d9489c7",
                    borderColor: "#0d9489c7",
                  }}
                >
                  {sys.sys.chat.send}
                </Button>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-icon-wrapper">
                <MessageOutlined className="empty-chat-emoji" />
              </div>

              <Title level={4}>Start Private Chats</Title>

              <Text type="secondary">
                Select a conversation to start messaging securely.
              </Text>
            </div>
          )}
        </Content>

        <NewChatModal
          open={newChatVisible}
          onClose={() => setNewChatVisible(false)}
          onSelect={handleNewChatSelect}
          onContactsLoaded={setContacts}
        />
      </Layout>
    </div>
  );
}

