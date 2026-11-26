
import {
  useCallback,
  useMemo, useEffect,
} from "react";
import { Layout, Modal, message as antdMessage } from "antd";
import { useNavigate } from "react-router-dom";
import type { EmojiClickData } from "emoji-picker-react";

import { useAuth } from "../context/authContext";
import { useWebSocket } from "../context/WebSocketContext";

import { useChatHandlers } from "../hooks/useChatHandlers";
import { useChatSocket } from "../hooks/useChatSocket";

import { useChatState } from "../hooks/chats/useChatState";
import { useChatData } from "../hooks/chats/useChatData";
import { useChatPersistence } from "../hooks/chats/useChatPersistence";
import { useChatMessages } from "../hooks/chats/useChatMessages";
import { useChatForwarding } from "../hooks/chats/useChatForwarding";
import { useChatConversationActions } from "../hooks/chats/useChatConversationActions";
import { useChatWallpaper } from "../hooks/chats/useChatWallpaper";
import { useChatNotifications } from "../hooks/chats/useChatNotifications";

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

import GroupInfoModal from "../components/Group/GroupInfoModal";
import ConversationDetailsDrawer from "../components/sideDrawer/ConversationDetailsDrawer";

import type {
  ChatMessage,
  Conversation,
} from "../types/chats.type";

import type {
  ProfileMenuAction,
} from "../components/profile/ProfileMenu";

import {
  localChatService,
} from "../services/localChatService";
import { tokenStore } from "../Axios/axiosService";

import sys from "../constant/navigation.json";
import "../index.css";
import { groupService } from "../services/groupServices";

const { Sider, Content } = Layout;

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const { connected, publish, subscribe } = useWebSocket();
  const navigate = useNavigate();

  const userId = String(user?.id ?? "");
  const userEmail = String(user?.email ?? "");
  const {
    conversations,
    setConversations,
    selected,
    setSelected,
    contacts,
    setContacts,
    draft,
    setDraft,
    messagesByConversation,
    setMessagesByConversation,
    mobileView,
    setMobileView,
    showEmojiPicker,
    setShowEmojiPicker,
    attachments,
    setAttachments,
    createGroupVisible,
    setCreateGroupVisible,
    newChatVisible,
    setNewChatVisible,
    sidebarQuery,
    setSidebarQuery,
    sidebarTab,
    setSidebarTab,
    localDataLoaded,
    setLocalDataLoaded,
    onlineUsers,
    setOnlineUsers,
    // existingOnlineUsers,
    setExistingOnlineUsers,
    profileStatus,
    setProfileStatus,
    wallpaperUrl,
    setWallpaperUrl,
    detailsOpen,
    setDetailsOpen,
    forwardMessages,
    setForwardMessages,
    forwardModalOpen,
    setForwardModalOpen,
    selectedMessageIds,
    setSelectedMessageIds,
    attachmentProgress,
    // setAttachmentProgress,
    groupInfoOpen,
    setGroupInfoOpen,
    isUploading,
    // setIsUploading,
    conversationsRef,
    selectedRef,
    messages,
    selectedMessages,
  } = useChatState();

  const {
    loadMyGroups,
    visibleConversations,
    unreadTotal,
  } = useChatData({
    conversations,
    setConversations,
    sidebarQuery,
    sidebarTab,
    contacts,
  });
  // Load groups automatically after login and local chat restoration
  useEffect(() => {
    if (!userId || !localDataLoaded) return;

    void loadMyGroups();
  }, [userId, localDataLoaded, loadMyGroups]);
  useChatPersistence({
    userId,
    conversations,
    setConversations,
    messagesByConversation,
    setMessagesByConversation,
    localDataLoaded,
    setLocalDataLoaded,
  });

  const {
    sendMessage,
    downloadIncomingAttachments,
  } = useChatMessages({
    userEmail,
    userId,
    selected,
    draft,
    attachments,
    setDraft,
    setAttachments,
    setShowEmojiPicker,
    setMessagesByConversation,
    setConversations,
    publish,
  });

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
  const {
    toggleArchive,
    handleSelectConversation,
    handleNewChatSelect,
    handleDeleteConversation,
  } = useChatConversationActions({
    userId,
    conversations,
    selected,
    setConversations,
    setSelected,
    setMessagesByConversation,
    setDraft,
    setAttachments,
    setShowEmojiPicker,
    setMobileView,
    setSidebarTab,
    setSidebarQuery,
    sendReadAcknowledgement,
  });

  const { handleWallpaperChange } = useChatWallpaper({
    userId,
    conversationId: selected?.id ?? "",
    wallpaperUrl,
    setWallpaperUrl,
  });

  useChatNotifications();
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
        ? currentMessages.map((message) =>
          String(message.id) === String(messageId)
            ? {
              ...message,
              text: "This message was deleted",
              attachments: [],
              deleted: true,
              deletedForEveryone: true,
              deletedAt: Date.now(),
            }
            : message
        )
        : currentMessages.filter(
          (message) =>
            String(message.id) !== String(messageId)
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
                  ? updatedMessages[
                    updatedMessages.length - 1
                  ].text
                  : "",
            }
            : conversation
        )
      );
    },
    [
      selected,
      messagesByConversation,
      setMessagesByConversation,
      setConversations,
    ]
  );
  const handleClearGroupChat = async (groupId: string) => {
    if (!userId) return;

    await localChatService.clearMessages(userId, groupId);

    setMessagesByConversation((current) => ({
      ...current,
      [groupId]: [],
    }));

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === groupId
          ? {
            ...conversation,
            lastMessage: "",
            unread: 0,
          }
          : conversation
      )
    );
  };
  const {
    handleDeleteMessage,
    deletionModal,
  } = useDeletionMessage({
    userId: userEmail,
    conversationId: String(selected?.id ?? ""),
    recipientId: String(selected?.username ?? ""),
    publish,
    onMessageDeleted: handleMessageDeleted,
  });

  const onNewChatSelect = useCallback(
    (contact: NewChatContact) => {
      handleNewChatSelect(
        contact,
        () => setNewChatVisible(false)
      );
    },
    [handleNewChatSelect, setNewChatVisible]
  );


  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setDraft((current) => current + emojiData.emoji);
  };

  const handleCreateGroup = async () => {
    await loadMyGroups();

    setSidebarTab("all");
    setSidebarQuery("");
    setCreateGroupVisible(false);
  };

  const handleProfileAction = async (
    action: ProfileMenuAction
  ) => {
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
          console.error("Failed to sign out cleanly:", error);
        } finally {
          tokenStore.clear();
          navigate("/signin", { replace: true });
        }
        break;
    }
  };

  const {
    forwardMessageToConversation,
  } = useChatForwarding({
    userEmail,
    publish,
    setMessagesByConversation,
    setConversations,
  });

  const handleForwardSelectedMessages = (
    selectedItems: ChatMessage[]
  ) => {
    const validMessages = selectedItems.filter(
      (message) => !message.deleted
    );

    if (!validMessages.length) {
      antdMessage.warning(
        "Deleted messages cannot be forwarded"
      );
      return;
    }

    setForwardMessages(validMessages);
    setForwardModalOpen(true);
  };

  const handleCancelMessageSelection = () => {
    setSelectedMessageIds([]);
  };

  const handleConfirmForward = async (
    selectedItems: ChatMessage[],
    targetConversation: Conversation
  ) => {
    try {
      for (const message of selectedItems) {
        await forwardMessageToConversation(
          message,
          targetConversation
        );
      }

      setForwardModalOpen(false);
      setForwardMessages([]);
      handleCancelMessageSelection();

      antdMessage.success(
        "Messages forwarded successfully"
      );
    } catch (error) {
      console.error("Forward message failed:", error);

      antdMessage.error(
        error instanceof Error
          ? error.message
          : "Unable to forward message"
      );
    }
  };

  const isSelectionMode = selectedMessageIds.length > 0;

  const handleToggleMessageSelection = (
    chatMessage: ChatMessage
  ) => {
    const messageId = String(chatMessage.id);

    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
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
            (item) =>
              !deletedIds.has(String(item.id))
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

          antdMessage.success(
            "Selected messages deleted"
          );
        } catch (error) {
          console.error(
            "Failed to delete selected messages:",
            error
          );

          antdMessage.error(
            "Unable to delete selected messages"
          );
        }
      },
    });
  };

  const isSelectedGroup = Boolean(
    selected &&
    (
      selected.isGroup ||
      selected.groupId ||
      !selected.username
    )
  );

  const handleLeaveGroup = async (
    groupId: string,
    payload: {
      userDetails: {
        userId: string;
        mail: string;
        name: string;
      };
    }
  ) => {
    if (!userId) return;

    // First leave the group on the backend.
    await groupService.leaveGroupMember(groupId, payload);

    // Use the local conversation ID, which may differ from groupId.
    const conversationId = selected?.id ?? groupId;

    // Then remove this user's local conversation and messages.
    await localChatService.deleteConversation(
      userId,
      conversationId
    );

    setConversations((current) =>
      current.filter((item) => item.id !== conversationId)
    );

    setMessagesByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });

    setSelected(null);
    setMobileView("sidebar");
  };

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
            onCreateGroup={() =>
              setCreateGroupVisible(true)
            }
          />

          <CreateGroupModal
            open={createGroupVisible}
            conversations={contacts.map((contact) => ({
              id: contact.id,
              name: contact.name,
            }))}
            onClose={() =>
              setCreateGroupVisible(false)
            }
            onCreate={handleCreateGroup}
            loadMyGroups={loadMyGroups}
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
                onOpenDetails={() => {
                  if (isSelectedGroup) {
                    setGroupInfoOpen(true);
                  } else {
                    setDetailsOpen(true);
                  }
                }}
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
                    onToggleMessageSelection={
                      handleToggleMessageSelection
                    }
                  />
                </div>

                {/* Forward messages */}
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

                {/* Message selection toolbar */}
                {isSelectionMode && (
                  <MessageSelectionToolbar
                    selectedMessages={selectedMessages}
                    onForward={
                      handleForwardSelectedMessages
                    }
                    onCopy={handleCopySelectedMessages}
                    onDelete={
                      handleDeleteSelectedMessages
                    }
                    onCancel={
                      handleCancelMessageSelection
                    }
                  />
                )}
              </div>

              {/* Message composer */}
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
                placeholder={
                  sys.sys.chat.messagePlaceholder
                }
                sendLabel={sys.sys.chat.send}
              />

              {/* Individual conversation details */}
              {!isSelectedGroup && (
                <ConversationDetailsDrawer
                  selected={selected}
                  onlineUsers={onlineUsers}
                  messages={messages}
                  open={detailsOpen}
                  onClose={() => setDetailsOpen(false)}
                  onWallpaperChange={handleWallpaperChange}
                />
              )}

              {/* Group information */}
              {isSelectedGroup && (
                <GroupInfoModal
                  open={groupInfoOpen}
                  group={selected}
                  messages={messages}
                  currentUserId={userId}
                  contacts={contacts.map((contact) => ({
                    id: String(contact.id),
                    name: contact.name,
                    email: contact.subtitle,
                  }))}
                  onClose={() =>
                    setGroupInfoOpen(false)
                  }
                  onClearChat={handleClearGroupChat}
                  onLeaveGroup={handleLeaveGroup}
                   onGroupWallpaperChange={handleWallpaperChange}
                />
              )}
            </>
          ) : (
            <EmptyChat />
          )}
        </Content>

        {/* New chat modal - kept unchanged */}
        <NewChatModal
          open={newChatVisible}
          onClose={() => setNewChatVisible(false)}
          onSelect={onNewChatSelect}
          onContactsLoaded={setContacts}
        />
      </Layout>

      {deletionModal}
    </div>
  );
}
