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

  const handleDeleteMessage = (chatMessage: ChatMessage) => {
    if (!selected) {
      console.error("No conversation selected");
      return;
    }

    Modal.confirm({
      title: "Delete message?",
      content: "Are you sure you want to delete this message?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",

      onOk: async () => {
        try {
          const conversationId = selected.id;

          console.log("Deleting message:", {
            userId,
            conversationId,
            messageId: chatMessage.id,
          });

          const result = await localChatService.deleteMessage(
            userId,
            conversationId,
            String(chatMessage.id)
          );

          console.log("SQLite delete result:", result);

          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: (
              current[conversationId] ?? []
            ).filter(
              (item) =>
                String(item.id) !== String(chatMessage.id)
            ),
          }));

          setConversations((current) =>
            current.map((conversation) => {
              if (conversation.id !== conversationId) {
                return conversation;
              }

              const remaining = (
                messagesByConversation[conversationId] ?? []
              ).filter(
                (item) =>
                  String(item.id) !== String(chatMessage.id)
              );

              return {
                ...conversation,
                lastMessage: remaining.length
                  ? remaining[remaining.length - 1].text
                  : "",
              };
            })
          );

          antdMessage.success(
            "Message deleted successfully"
          );
        } catch (error) {
          console.error("Delete message failed:", error);
          antdMessage.error("Unable to delete message");
        }
      },
    });
  };

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
    if (e) {
      e.preventDefault();
    }

    const text = draft.trim();

    if ((!text && attachments.length === 0) || !selected) {
      return;
    }
    const messageId = crypto.randomUUID();
    try {
      if (attachments.length > 0) {
        await Promise.all(
          attachments.map((file) =>
            chatService.sendAttachment(
              String(selected.username),
              file, messageId
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
            bytes: new Uint8Array(
              await file.arrayBuffer()
            ),
          });
        })
      );



      const newMessage: ChatMessage = {
        id: messageId,
        text,
        mine: true,
        status: "sent",
        attachments: savedAttachments,
        createdAt: Date.now(),
      };
      if (text) {
        const payload = {
          messageId,
          senderId: String(user?.email ?? ""),
          receiverId: String(selected.username),
          content: text,
          messageType: "TEXT",
          attachments: [],
        };
        console.log("Publishing TEXT message:", payload);
        publish("/app/chat.send", payload);
      } else {
        console.log(
          "Attachment uploaded through API. No WebSocket publish."
        );
      }

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
      console.error(
        "Failed to send message or attachment:",
        error
      );
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
          savedConversations.map((conversation) => ({
            id: conversation.id,
            name: conversation.name,
            lastMessage: conversation.lastMessage,
            unread: conversation.unread,
            archived: conversation.archived,
            username: conversation.username,
          }))
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
            attachments: message.attachments,
            status: message.status ?? (message.mine ? "sent" : undefined),
            createdAt: message.createdAt,
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
                {/* Wallpaper background */}
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
                  />
                </div>
              </div>

              <MessageComposer
                draft={draft}
                attachments={attachments}
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
    </div>
  );
}
