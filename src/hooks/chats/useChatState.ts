import { useMemo, useRef, useState } from "react";
import type { Conversation, ChatMessage, SidebarTab } from "../../types/chats.type";
import type { NewChatContact } from "../../types/NewChatModal.types";
import type { ProfileStatus } from "../../types/profileMenu.types";

export function useChatState() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [contacts, setContacts] = useState<NewChatContact[]>([]);
  const [draft, setDraft] = useState("");
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>({});
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
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("available");
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [forwardMessages, setForwardMessages] = useState<ChatMessage[]>([]);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [attachmentProgress, setAttachmentProgress] = useState<number[]>([]);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      if (query && !conversation.name.toLowerCase().includes(query)) return false;
      if (sidebarTab === "archived") return Boolean(conversation.archived);
      if (conversation.archived) return false;
      if (sidebarTab === "unread") return (conversation.unread ?? 0) > 0;
      return true;
    });
  }, [conversations, sidebarQuery, sidebarTab]);

  const unreadTotal = conversations.filter(
    (conversation) => !conversation.archived && (conversation.unread ?? 0) > 0
  ).length;

  const selectedMessages = useMemo(
    () => messages.filter((item) => selectedMessageIds.includes(String(item.id))),
    [messages, selectedMessageIds]
  );

  return {
    conversations, setConversations,
    selected, setSelected,
    contacts, setContacts,
    draft, setDraft,
    messagesByConversation, setMessagesByConversation,
    mobileView, setMobileView,
    showEmojiPicker, setShowEmojiPicker,
    attachments, setAttachments,
    createGroupVisible, setCreateGroupVisible,
    newChatVisible, setNewChatVisible,
    groupName, setGroupName,
    groupMembers, setGroupMembers,
    sidebarQuery, setSidebarQuery,
    sidebarTab, setSidebarTab,
    localDataLoaded, setLocalDataLoaded,
    onlineUsers, setOnlineUsers,
    existingOnlineUsers, setExistingOnlineUsers,
    profileStatus, setProfileStatus,
    wallpaperUrl, setWallpaperUrl,
    detailsOpen, setDetailsOpen,
    forwardMessages, setForwardMessages,
    forwardModalOpen, setForwardModalOpen,
    selectedMessageIds, setSelectedMessageIds,
    attachmentProgress, setAttachmentProgress,
    groupInfoOpen, setGroupInfoOpen,
    isUploading, setIsUploading,
    conversationsRef, selectedRef,
    messages, visibleConversations, unreadTotal,
    selectedMessages,
  };
}
