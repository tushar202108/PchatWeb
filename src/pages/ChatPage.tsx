import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { FormEvent } from "react";
import { Layout, Modal } from "antd";
import { message as antdMessage } from "antd";
import { useNavigate } from "react-router-dom";
import type { EmojiClickData } from "emoji-picker-react";
import { useAuth } from "../context/authContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useChatHandlers } from "../hooks/useChatHandlers";
import { useChatSocket } from "../hooks/useChatSocket";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageComposer from "../components/chat/MessageComposer";
import EmptyChat from "../components/chat/EmptyChat";
import NewChatModal from "../components/modals/NewChatModal";
import CreateGroupModal from "../components/modals/CreateGroupModal";
import type { NewChatContact } from "../types/NewChatModal.types";
import { useDeletionMessage } from "../components/DeletetionMessage";
import MessageSelectionToolbar from "../components/Actions/MessageSelectionToolbar";
import ForwardMessageModal from "../components/ForwardMessageModal/ForwardMessageModal";
import type {
  ChatMessage,
  Conversation,
  IncomingChatMessage,
  SidebarTab,
} from "../types/chats.type";
import type {
  ProfileMenuAction,
  ProfileStatus,
} from "../components/profile/ProfileMenu";
import {
  MIN_GROUP_MEMBERS,
} from "../types/chats.type";
import {
  localChatService,
} from "../services/localChatService";
import { chatService } from "../services/chatService";
import type {
  LocalChatMessage,
  LocalConversation,
} from "../DataStorage/chatStorage";
import { tokenStore } from "../Axios/axiosService";
import sys from "../constant/navigation.json";
import "../index.css";
import ConversationDetailsDrawer from "../components/sideDrawer/ConversationDetailsDrawer"


const { Sider, Content } = Layout;
export default function ChatPage() {
  const { user, signOut } = useAuth();
  const { connected, publish, subscribe } = useWebSocket();
  const navigate = useNavigate();
  const userId = String(user?.id ?? "");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [contacts, setContacts] = useState<NewChatContact[]>([]);
  const [draft, setDraft] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
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
  const [profileStatus, setProfileStatus] =
    useState<ProfileStatus>("available");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const conversationsRef = useRef(conversations);
  const [forwardMessages, setForwardMessages] = useState<ChatMessage[]>([]);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [attachmentProgress, setAttachmentProgress] =
    useState<number[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const selectedRef = useRef(selected);
  conversationsRef.current = conversations;
  selectedRef.current = selected;
  const messages = selected
    ? messagesByConversation[selected.id] ?? []
    : [];

  const visibleConversations = useMemo(() => {
    const query = sidebarQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
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
  }, [conversations, sidebarQuery, sidebarTab]);
  const unreadTotal = conversations.filter(
    (conversation) =>
      !conversation.archived && (conversation.unread ?? 0) > 0
  ).length;
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

  const downloadIncomingAttachments = useCallback(
    async (
      received: IncomingChatMessage,
      conversationId: string
    ) => {
      const receivedFiles = Array.isArray(
        (received as any).attachments
      )
        ? (received as any).attachments
        : (received as any).file
          ? [received]
          : [];

      if (!receivedFiles.length) {
        console.warn(
          "No attachment found in WebSocket message:",
          received
        );
        return [];
      }

      const downloadedAttachments = await Promise.all(
        receivedFiles.map(async (item: any) => {
          const file = item.file ?? item;

          if (!file.downloadUrl) {
            console.warn("Missing downloadUrl:", file);
            return null;
          }

          try {
            const blob = await chatService.downloadAttachment(
              file.downloadUrl
            );

            const savedAttachment =
              await window.chatStorage.saveAttachment({
                userId: String(user?.email ?? ""),
                conversationId: String(conversationId),
                name: file.fileName,
                type: file.fileType,
                bytes: new Uint8Array(await blob.arrayBuffer()),
              });

            console.log(
              "Attachment downloaded and saved:",
              file.fileName
            );

            return {
              ...savedAttachment,
              id: String(file.fileId),
              name: file.fileName,
              type: file.fileType,
              size: file.fileSize,
            };
          } catch (error) {
            console.error("Attachment download failed:", error);
            return null;
          }
        })
      );

      return downloadedAttachments.filter(Boolean);
    },
    [user?.email]
  );
  const {
    handleExistingUserStatus,
    handleUserStatus,
    handleIncomingMessage,
    handleUserAcknowledge,
    sendReadAcknowledgement,
  } = useChatHandlers({
    user,
    connected,
    publish,
    conversationsRef,
    selectedRef,
    messagesByConversation,
    setMessagesByConversation,
    setConversations,
    setOnlineUsers,
    setExistingOnlineUsers,
    downloadIncomingAttachments,
  });

  useChatSocket({
    connected,
    localDataLoaded,
    subscribe,
    onIncomingMessage: handleIncomingMessage,
    onUserStatus: handleUserStatus,
    existingOnlineUser: handleExistingUserStatus,
    userAcknowledge: handleUserAcknowledge,
  });

  const toggleArchive = (id: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? {
            ...conversation,
            archived: !conversation.archived,
          }
          : conversation
      )
    );
  };

  const handleDeleteConversation = (
    conversation: Conversation
  ) => {
    Modal.confirm({
      title: "Delete conversation?",
      content: "Are you sure you want to delete this conversation?",
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
            current.filter(
              (item) => item.id !== conversation.id
            )
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
          console.error(
            "Failed to delete conversation:",
            error
          );
        }
      },
    });
  };

  const handleMessageDeleted = useCallback(
    (
      messageId: string | number,
      deletedForEveryone: boolean
    ) => {
      if (!selected) return;

      const conversationId = selected.id;

      const currentMessages =
        messagesByConversation[conversationId] ?? [];

      const updatedMessages = deletedForEveryone
        ? currentMessages.map((msg) =>
          String(msg.id) === String(messageId)
            ? {
              ...msg,
              text: "This message was deleted",
              attachments: [],
              deleted: true,
              deletedForEveryone: true,
              deletedAt: Date.now(),
            }
            : msg
        )
        : currentMessages.filter(
          (msg) => String(msg.id) !== String(messageId)
        );

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: updatedMessages,
      }));

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
              ...conversation,
              lastMessage:
                updatedMessages.length > 0
                  ? updatedMessages[updatedMessages.length - 1].text
                  : "",
            }
            : conversation
        )
      );
    },
    [selected, messagesByConversation]
  );

  const { handleDeleteMessage, deletionModal } = useDeletionMessage({
    userId: String(user?.email ?? ""),
    conversationId: String(selected?.id ?? ""),
    recipientId: String(selected?.username ?? ""),
    publish,
    onMessageDeleted: handleMessageDeleted,
  });
  const handleSelectConversation = (
    item: Conversation
  ) => {
    console.log("UserSelectedItems", item);

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
            : conversation
        )
      );
    }
  };

  const handleNewChatSelect = (
    contact: NewChatContact
  ) => {
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

      setConversations((current) => [
        newConversation,
        ...current,
      ]);

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

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();

    const text = draft.trim();

    if ((!text && attachments.length === 0) || !selected) {
      return;
    }

    const messageId = crypto.randomUUID();
    const senderId = String(user?.email ?? "");
    const receiverId = String(selected.username);
    const conversationId = String(selected.id);
    const filesToUpload = [...attachments];

    const now = Date.now();

    // Create temporary attachments with local previews
    const pendingAttachments: LocalAttachment[] =
      filesToUpload.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        storageKey: "",
        previewUrl: URL.createObjectURL(file),
        uploadProgress: 0,
        uploadStatus: "uploading",
      }));

    // Immediately add the message to the conversation
    const newMessage: ChatMessage = {
      id: messageId,
      text,
      mine: true,
      status: "sent",
      attachments: pendingAttachments,
      createdAt: now,
      uploadStatus: filesToUpload.length ? "uploading" : "uploaded",
    };

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [
        ...(current[conversationId] ?? []),
        newMessage,
      ],
    }));

    setConversations((current) => {
      const updated = current.map((conversation) =>
        String(conversation.id) === conversationId
          ? {
            ...conversation,
            lastMessage:
              text || `📎 ${filesToUpload.length} attachment(s)`,
            lastMessageAt: now,
          }
          : conversation
      );

      return updated.sort(
        (a, b) =>
          (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
      );
    });

    // Clear composer immediately
    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);

    // Publish text through WebSocket
    if (text) {
      publish("/app/chat.send", {
        messageId,
        senderId,
        receiverId,
        content: text,
        messageType: "TEXT",
        attachments: [],
      });
    }

    if (!filesToUpload.length) return;

    try {
      const results = await Promise.allSettled(
        filesToUpload.map(async (file, index) => {
          const temporaryId = pendingAttachments[index].id;

          // Upload attachment and update its individual progress
          await chatService.sendAttachment(
            receiverId,
            file,
            messageId,
            (progress) => {
              setMessagesByConversation((current) => ({
                ...current,
                [conversationId]: (
                  current[conversationId] ?? []
                ).map((message) =>
                  String(message.id) === messageId
                    ? {
                      ...message,
                      attachments: (message.attachments ?? []).map(
                        (attachment) =>
                          attachment.id === temporaryId
                            ? {
                              ...attachment,
                              uploadProgress: progress,
                            }
                            : attachment
                      ),
                    }
                    : message
                ),
              }));
            }
          );

          // Save uploaded attachment locally
          const savedAttachment =
            await window.chatStorage.saveAttachment({
              userId: senderId,
              conversationId,
              name: file.name,
              type: file.type,
              bytes: new Uint8Array(await file.arrayBuffer()),
            });

          // Replace temporary attachment with saved attachment
          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: (
              current[conversationId] ?? []
            ).map((message) =>
              String(message.id) === messageId
                ? {
                  ...message,
                  attachments: (message.attachments ?? []).map(
                    (attachment) =>
                      attachment.id === temporaryId
                        ? {
                          ...savedAttachment,
                          uploadProgress: 100,
                          uploadStatus: "uploaded" as const,
                        }
                        : attachment
                  ),
                }
                : message
            ),
          }));

          URL.revokeObjectURL(
            pendingAttachments[index].previewUrl!
          );

          return savedAttachment;
        })
      );

      const hasFailed = results.some(
        (result) => result.status === "rejected"
      );

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (
          current[conversationId] ?? []
        ).map((message) =>
          String(message.id) === messageId
            ? {
              ...message,
              uploadStatus: hasFailed ? "failed" : "uploaded",
              attachments: (message.attachments ?? []).map(
                (attachment) =>
                  attachment.uploadStatus === "uploading"
                    ? {
                      ...attachment,
                      uploadStatus: "failed" as const,
                    }
                    : attachment
              ),
            }
            : message
        ),
      }));

      if (hasFailed) {
        antdMessage.error(
          "Some attachments failed to upload. Please retry."
        );
      }
    } catch (error) {
      console.error("Attachment upload failed:", error);

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (
          current[conversationId] ?? []
        ).map((message) =>
          String(message.id) === messageId
            ? {
              ...message,
              uploadStatus: "failed",
            }
            : message
        ),
      }));
    }
  };

  const handleEmojiClick = (
    emojiData: EmojiClickData
  ) => {
    setDraft((current) => current + emojiData.emoji);
  };
  const handleCreateGroup = () => {
    const name = groupName.trim();

    if (
      !name ||
      groupMembers.length < MIN_GROUP_MEMBERS
    ) {
      return;
    }

    const groupId = `group-${Date.now()}`;

    const newGroup: Conversation = {
      id: groupId,
      name,
      lastMessage: "Group created",
    };

    setConversations((current) => [
      newGroup,
      ...current,
    ]);

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

  const handleProfileAction = async (
    action: ProfileMenuAction
  ) => {
    console.log("ActionInHandleProfile", action);

    switch (action) {
      case "profile":
        navigate("/complete-profile");
        break;

      case "settings":
      case "privacy":
        navigate("/privacy");
        break;
      case "themeSelector":
        navigate("/themeSelector");
        break;

      case "logout":
        try {
          const refreshToken = localStorage.getItem(
            "app_refresh_token"
          );

          await signOut({
            refreshToken: refreshToken ?? "",
          });
        } catch (error) {
          console.error(
            "Failed to sign out cleanly:",
            error
          );
        } finally {
          tokenStore.clear();
          navigate("/signin", { replace: true });
        }
        break;
    }
  };

  const handleForwardSelectedMessages = (messages: ChatMessage[]) => {
    const validMessages = messages.filter(
      (message) => !message.deleted
    );

    if (!validMessages.length) {
      antdMessage.warning("Deleted messages cannot be forwarded");
      return;
    }

    setForwardMessages(validMessages);
    setForwardModalOpen(true);
  };

  const forwardMessageToConversation = async (
    sourceMessage: ChatMessage,
    targetConversation: Conversation
  ) => {
    if (!sourceMessage || !targetConversation) return;

    if (sourceMessage.deleted) {
      antdMessage.warning("Deleted messages cannot be forwarded");
      return;
    }

    const newMessageId = crypto.randomUUID();
    const senderId = String(user?.email ?? "").trim();
    const receiverId = String(targetConversation.username ?? "").trim();
    const targetConversationId = String(targetConversation.id);

    if (!senderId || !receiverId) {
      antdMessage.error("Sender or recipient information is missing");
      return;
    }

    try {
      // 1. Upload attachments through API
      const forwardedAttachments = await Promise.all(
        (sourceMessage.attachments ?? []).map(async (attachment) => {
          const dataUrl = await window.chatStorage.getAttachment(
            attachment.storageKey
          );

          if (!dataUrl) {
            throw new Error(`Attachment not found: ${attachment.name}`);
          }

          const response = await fetch(dataUrl);
          const blob = await response.blob();

          const file = new File([blob], attachment.name, {
            type: attachment.type || blob.type,
          });

          // Existing attachment API
          await chatService.sendAttachment(
            receiverId,
            file,
            newMessageId
          );

          // Save a separate local copy
          return await window.chatStorage.saveAttachment({
            userId: senderId,
            conversationId: targetConversationId,
            name: file.name,
            type: file.type,
            bytes: new Uint8Array(await file.arrayBuffer()),
          });
        })
      );

      // 2. Create forwarded message
      const forwardedMessage: ChatMessage = {
        id: newMessageId,
        text: sourceMessage.text ?? "",
        mine: true,
        senderId,
        status: "sent",
        attachments: forwardedAttachments,
        createdAt: Date.now(),
        forwarded: true,
        conversationId: targetConversationId,
      };

      // SAVE TO SQLITE
      try {
        console.log("Saving forwarded message:", forwardedMessage);

        await localChatService.saveMessages(senderId, [
          forwardedMessage,
        ]);

        // Verify by reading it back from SQLite
        const savedMessages = await localChatService.getMessages(
          senderId,
          targetConversationId
        );

        const savedMessage = savedMessages.find(
          (message: ChatMessage) =>
            String(message.id) === String(newMessageId)
        );

        console.log("Forwarded message read from SQLite:", savedMessage);

        if (!savedMessage?.forwarded) {
          throw new Error("Forwarded flag was not persisted in SQLite");
        }
      } catch (error) {
        console.error("Forwarded message save failed:", error);
        throw error;
      }
      // 3. Publish one WebSocket message
      const payload = {
        messageId: newMessageId,
        senderId,
        receiverId,
        content: sourceMessage.text ?? "",
        messageType: "TEXT",
        forwarded: true,
        attachments: forwardedAttachments.map((attachment) => ({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          storageKey: attachment.storageKey,
        })),
      };

      publish("/app/chat.send", payload);
      console.log(
        "FORWARD STATE CHECK:",
        forwardedMessage
      );
      // 4. Update local UI
      setMessagesByConversation((current) => ({
        ...current,
        [targetConversationId]: [
          ...(current[targetConversationId] ?? []),
          forwardedMessage,
        ],
      }));

      // 5. Update conversation preview and order
      setConversations((current) => {
        const updated = current.map((conversation) =>
          String(conversation.id) === targetConversationId
            ? {
              ...conversation,
              lastMessage:
                sourceMessage.text ||
                `📎 ${forwardedAttachments.length} attachment(s)`,
              lastMessageAt: forwardedMessage.createdAt,
            }
            : conversation
        );

        return updated.sort(
          (a, b) =>
            (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
        );
      });

    } catch (error) {
      console.error("Forward message failed:", error);
      antdMessage.error("Unable to forward message");
    }
  };
  const handleConfirmForward = async (
    messages: ChatMessage[],
    targetConversation: Conversation
  ) => {
    for (const message of messages) {
      await forwardMessageToConversation(
        message,
        targetConversation
      );
    }

    setForwardModalOpen(false);
    setForwardMessages([]);
    handleCancelMessageSelection();

    antdMessage.success("Messages forwarded successfully");
  };

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadLocalChatData = async () => {
      setLocalDataLoaded(false);

      try {
        const [
          savedConversations,
          savedMessages,
        ] = await Promise.all([
          localChatService.getConversations(userId),
          localChatService.getAllMessages(userId),
        ]);

        if (cancelled) return;

        setConversations(
          savedConversations
            .map((conversation) => ({
              id: conversation.id,
              name: conversation.name,
              lastMessage: conversation.lastMessage,
              unread: conversation.unread,
              archived: conversation.archived,
              username: conversation.username,
              lastMessageAt: conversation.lastMessageAt,
            }))
            .sort(
              (a, b) =>
                (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
            )
        );

        const groupedMessages: Record<
          string,
          ChatMessage[]
        > = {};

        savedMessages.forEach((message) => {
          if (!groupedMessages[message.conversationId]) {
            groupedMessages[message.conversationId] = [];
          }

          groupedMessages[message.conversationId].push({
            id: message.id,
            text: message.text,
            mine: message.mine,
            senderName: message.senderName,
            attachments: (message.attachments ?? [])
              .filter((attachment) => Boolean(attachment.storageKey))
              .map(({ id, name, type, size, storageKey }) => ({
                id,
                name,
                type,
                size,
                storageKey,
              })),
            status: message.status ?? (message.mine ? "sent" : undefined),
            createdAt: message.createdAt,
            forwarded: message.forwarded
          });
        });

        Object.values(groupedMessages).forEach((items) => {
          items.sort(
            (a, b) =>
              (a.createdAt ?? 0) - (b.createdAt ?? 0)
          );
        });

        setMessagesByConversation(groupedMessages);
      } catch (error) {
        console.error(
          "Failed to load local chat data:",
          error
        );
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
        console.error(
          "Failed to save conversations:",
          error
        );
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
          ([conversationId, conversationMessages]) => {
            conversationMessages.forEach((message) => {
              localMessages.push({
                id: String(message.id),
                userId,
                conversationId: String(conversationId),
                senderId: userId,
                text: message.text,
                mine: message.mine,
                senderName: message.senderName,
                attachments: message.attachments,
                status: message.status ?? (message.mine ? "sent" : undefined),
                createdAt: message.createdAt ?? Date.now(),
                forwarded: message.forwarded,
              });
            });
          }
        );

        await localChatService.saveMessages(
          userId,
          localMessages
        );
      } catch (error) {
        console.error(
          "Failed to save messages:",
          error
        );
      }
    };

    saveMessages();
  }, [messagesByConversation, userId, localDataLoaded]);

  // Load the logged-in user's wallpaper
  useEffect(() => {
    if (!userId) {
      setWallpaperUrl("");
      return;
    }

    try {
      const savedWallpaper = localStorage.getItem(
        `pchat_wallpaper_${userId}`
      );

      setWallpaperUrl(savedWallpaper ?? "");
    } catch (error) {
      console.error("Failed to load chat wallpaper:", error);
      setWallpaperUrl("");
    }
  }, [userId]);

  // Update wallpaper for all conversations of the logged-in user
  const handleWallpaperChange = useCallback(
    (url: string) => {
      setWallpaperUrl(url);

      if (!userId) return;

      try {
        const storageKey = `pchat_wallpaper_${userId}`;

        if (url) {
          localStorage.setItem(storageKey, url);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Failed to save chat wallpaper:", error);
        antdMessage.error("Unable to save wallpaper");
      }
    },
    [userId]
  );

  const selectedMessages = useMemo(
    () =>
      messages.filter((item) =>
        selectedMessageIds.includes(String(item.id))
      ),
    [messages, selectedMessageIds]
  );

  const isSelectionMode = selectedMessageIds.length > 0;
  const handleToggleMessageSelection = (chatMessage: ChatMessage) => {
    const messageId = String(chatMessage.id);

    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  };

  const handleCancelMessageSelection = () => {
    setSelectedMessageIds([]);
  };

  const handleCopySelectedMessages = async (
    selectedItems: ChatMessage[]
  ) => {
    try {
      const copiedText = selectedItems
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n\n");

      if (!copiedText) {
        antdMessage.info("No message text to copy");
        return;
      }

      await navigator.clipboard.writeText(copiedText);

      antdMessage.success("Messages copied");
      setSelectedMessageIds([]);
    } catch (error) {
      console.error("Failed to copy messages:", error);
      antdMessage.error("Unable to copy messages");
    }
  };
  const handleDeleteSelectedMessages = (
    selectedItems: ChatMessage[]
  ) => {
    if (!selected || selectedItems.length === 0) return;

    const conversationId = selected.id;

    Modal.confirm({
      title: "Delete selected messages?",
      content: `Are you sure you want to delete ${selectedItems.length} selected message(s)?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => {
        try {
          await Promise.all(
            selectedItems.map((item) =>
              localChatService.deleteMessage(
                userId,
                conversationId,
                String(item.id)
              )
            )
          );

          const deletedIds = new Set(
            selectedItems.map((item) => String(item.id))
          );

          const remainingMessages = (
            messagesByConversation[conversationId] ?? []
          ).filter(
            (item) => !deletedIds.has(String(item.id))
          );

          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: remainingMessages,
          }));

          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === conversationId
                ? {
                  ...conversation,
                  lastMessage:
                    remainingMessages.length > 0
                      ? remainingMessages[
                        remainingMessages.length - 1
                      ].text
                      : "",
                }
                : conversation
            )
          );

          setSelectedMessageIds([]);

          antdMessage.success("Selected messages deleted");
        } catch (error) {
          console.error(
            "Failed to delete selected messages:",
            error
          );

          antdMessage.error("Unable to delete selected messages");
        }
      },
    });
  };
  console.log("existingOnlineUsers", existingOnlineUsers);
  return (
    <div className="app-shell">
      <Layout
        className={`chat-layout ${mobileView === "chat"
          ? "show-chat"
          : "show-sidebar"
          }`}
      >
        {/* Sidebar */}
        <Sider
          width={340}
          className="chat-sidebar"
          breakpoint="md"
          collapsedWidth={0}
        >
          <ChatSidebar
            user={user}
            connected={connected}
            profileStatus={profileStatus}
            conversations={visibleConversations}
            selected={selected}
            onlineUsers={onlineUsers}
            sidebarQuery={sidebarQuery}
            sidebarTab={sidebarTab}
            unreadTotal={unreadTotal}
            onStatusChange={setProfileStatus}
            onProfileAction={handleProfileAction}
            onSearchChange={setSidebarQuery}
            onTabChange={setSidebarTab}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onArchive={toggleArchive}
            onNewChat={() => setNewChatVisible(true)}
            onCreateGroup={() => setCreateGroupVisible(true)}
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
        </Sider>

        {/* Chat content */}
        <Content className="chat-content">
          {selected ? (
            <>
              <ChatHeader
                selected={selected}
                onlineUsers={onlineUsers}
                onBack={() => setMobileView("sidebar")}
                onOpenDetails={() => setDetailsOpen(true)}
              />
              <div className="chat-message-area">
                <div
                  className="chat-wallpaper-fixed"
                  style={{
                    backgroundImage: wallpaperUrl
                      ? `url("${wallpaperUrl}")`
                      : "none",
                  }}
                />

                {/* Messages */}
                <div className="chat-message-content">
                  <MessageList
                    messages={messages}
                    conversationImages={conversationImages}
                    onDeleteMessage={handleDeleteMessage}
                    noMessagesText={sys.sys.chat.noMessages}
                    selectedMessageIds={selectedMessageIds}
                    onToggleMessageSelection={handleToggleMessageSelection}
                  />
                </div>
                <ForwardMessageModal
                  open={forwardModalOpen}
                  messages={forwardMessages}
                  conversations={conversations}
                  onCancel={() => {
                    setForwardModalOpen(false);
                    setForwardMessages([]);
                  }}
                  onForward={handleConfirmForward}
                />
                {isSelectionMode && (
                  <MessageSelectionToolbar
                    selectedMessages={selectedMessages}
                    onForward={handleForwardSelectedMessages}
                    onCopy={handleCopySelectedMessages}
                    onDelete={handleDeleteSelectedMessages}
                    onCancel={handleCancelMessageSelection}
                  />
                )}
              </div>

              <MessageComposer
                draft={draft}
                attachments={attachments}
                attachmentProgress={attachmentProgress}
                uploading={isUploading}
                showEmojiPicker={showEmojiPicker}
                onDraftChange={setDraft}
                onAttachmentsChange={setAttachments}
                onEmojiClick={handleEmojiClick}
                onToggleEmoji={() =>
                  setShowEmojiPicker((current) => !current)
                }
                onSend={() => void sendMessage()}
                placeholder={sys.sys.chat.messagePlaceholder}
                sendLabel={sys.sys.chat.send}
              />

              <ConversationDetailsDrawer
                selected={selected}
                onlineUsers={onlineUsers}
                messages={messages}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                onWallpaperChange={handleWallpaperChange}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </Content>

        {/* New chat modal */}
        <NewChatModal
          open={newChatVisible}
          onClose={() => setNewChatVisible(false)}
          onSelect={handleNewChatSelect}
          onContactsLoaded={setContacts}
        />
      </Layout>
      {deletionModal}
    </div>
  );
}
