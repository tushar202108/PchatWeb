import { useCallback } from "react";
import { Modal } from "antd";
import type { Conversation } from "../../types/chats.type";
import type { NewChatContact } from "../../types/NewChatModal.types";
import { localChatService } from "../../services/localChatService";

interface Options {
  userId: string;
  conversations: Conversation[];
  selected: Conversation | null;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setSelected: (conversation: Conversation | null) => void;
  setMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setDraft: (value: string) => void;
  setAttachments: (files: File[]) => void;
  setShowEmojiPicker: (show: boolean) => void;
  setMobileView: (view: "sidebar" | "chat") => void;
  setSidebarTab: (tab: "all" | "unread" | "archived") => void;
  setSidebarQuery: (query: string) => void;
  sendReadAcknowledgement: (conversationId: string) => void;
}

export function useChatConversationActions(options: Options) {
  const {
    userId, conversations, selected, setConversations, setSelected,
    setMessagesByConversation, setDraft, setAttachments, setShowEmojiPicker,
    setMobileView, setSidebarTab, setSidebarQuery, sendReadAcknowledgement,
  } = options;

  const toggleArchive = useCallback((id: string) => {
    setConversations((current) => current.map((conversation) =>
      conversation.id === id ? { ...conversation, archived: !conversation.archived } : conversation
    ));
  }, [setConversations]);

  const handleSelectConversation = useCallback((item: Conversation) => {
    setSelected(item);
    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);
    setMobileView("chat");
    sendReadAcknowledgement(item.id);

    if ((item.unread ?? 0) > 0) {
      setConversations((current) => current.map((conversation) =>
        conversation.id === item.id ? { ...conversation, unread: 0 } : conversation
      ));
    }
  }, [
    sendReadAcknowledgement, setAttachments, setConversations, setDraft,
    setMobileView, setSelected, setShowEmojiPicker,
  ]);

  const handleNewChatSelect = useCallback((contact: NewChatContact, closeModal: () => void) => {
    const existing = conversations.find((conversation) =>
      conversation.id === contact.id ||
      String(conversation.username ?? "").toLowerCase() === String(contact.subtitle ?? "").toLowerCase()
    );

    if (existing) {
      if (existing.archived) toggleArchive(existing.id);
      handleSelectConversation(existing);
    } else {
      const created: Conversation = {
        id: contact.id,
        name: contact.name,
        lastMessage: "",
        username: contact.subtitle,
      };
      setConversations((current) => [created, ...current]);
      setMessagesByConversation((current) => ({ ...current, [contact.id]: current[contact.id] ?? [] }));
      setSidebarTab("all");
      setSidebarQuery("");
      handleSelectConversation(created);
    }
    closeModal();
  }, [
    conversations, handleSelectConversation, setConversations,
    setMessagesByConversation, setSidebarQuery, setSidebarTab, toggleArchive,
  ]);

  const handleDeleteConversation = useCallback((conversation: Conversation) => {
    Modal.confirm({
      title: "Delete conversation?",
      content: "Are you sure you want to delete this conversation?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await localChatService.deleteConversation(userId, conversation.id);
          setConversations((current) => current.filter((item) => item.id !== conversation.id));
          setMessagesByConversation((current) => {
            const next = { ...current };
            delete next[conversation.id];
            return next;
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
  }, [selected, setConversations, setMessagesByConversation, setMobileView, setSelected, userId]);

  return { toggleArchive, handleSelectConversation, handleNewChatSelect, handleDeleteConversation };
}
