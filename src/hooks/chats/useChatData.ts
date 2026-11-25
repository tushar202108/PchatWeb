import { useCallback, useMemo } from "react";
import type { Conversation } from "../../types/chats.type";
import type { NewChatContact } from "../../types/NewChatModal.types";
import { groupService } from "../../services/groupServices";

interface UseChatDataOptions {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  sidebarQuery: string;
  sidebarTab: "all" | "unread" | "archived";
  contacts: NewChatContact[];
}

export function useChatData({
  conversations,
  setConversations,
  sidebarQuery,
  sidebarTab,
}: UseChatDataOptions) {
  const loadMyGroups = useCallback(async () => {
    try {
      const groups = await groupService.GetGroups();

      const groupConversations: Conversation[] = groups
        .filter((group) => group.active)
        .map((group) => ({
          id: String(group.groupId),
          groupId: String(group.groupId),
          name: group.groupName,
          groupDescription: group.groupDescription ?? "",
          groupImage: group.groupImage ?? "",
          isGroup: true,
          lastMessage: group.groupDescription || "Group created",
          lastMessageAt: new Date(group.createdAt).getTime(),
          unread: 0,
          archived: false,
        }));

      setConversations((previous) => {
        const existing = new Map(
          previous.map((conversation) => [String(conversation.id), conversation])
        );

        groupConversations.forEach((group) => {
          existing.set(String(group.id), {
            ...existing.get(String(group.id)),
            ...group,
          });
        });

        return Array.from(existing.values()).sort(
          (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
        );
      });
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  }, [setConversations]);

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

  const unreadTotal = useMemo(
    () => conversations.filter(
      (conversation) => !conversation.archived && (conversation.unread ?? 0) > 0
    ).length,
    [conversations]
  );

  return { loadMyGroups, visibleConversations, unreadTotal };
}
