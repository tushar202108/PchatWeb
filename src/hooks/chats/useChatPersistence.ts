import { useEffect } from "react";
import type { ChatMessage, Conversation, } from "../../types/chats.type";
import { localChatService } from "../../services/localChatService";
import type { LocalChatMessage, LocalConversation } from "../../DataStorage/chatStorage";

interface Options {
  userId: string;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messagesByConversation: Record<string, ChatMessage[]>;
  setMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  localDataLoaded: boolean;
  setLocalDataLoaded: (loaded: boolean) => void;
}

export function useChatPersistence({
  userId,
  conversations,
  setConversations,
  messagesByConversation,
  setMessagesByConversation,
  localDataLoaded,
  setLocalDataLoaded,
}: Options) {
  useEffect(() => {
    if (!userId) {
      setLocalDataLoaded(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLocalDataLoaded(false);
      try {
        const [savedConversations, savedMessages] = await Promise.all([
          localChatService.getConversations(userId),
          localChatService.getAllMessages(userId),
        ]);

        if (cancelled) return;

        setConversations(
          (savedConversations as LocalConversation[])
            .map((conversation) => ({
              ...conversation,
              id: String(conversation.id),
            }))
            .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0))
        );

        const grouped: Record<string, ChatMessage[]> = {};
        (savedMessages as LocalChatMessage[]).forEach((message) => {
          const conversationId = String(message.conversationId);
          if (!grouped[conversationId]) grouped[conversationId] = [];

          grouped[conversationId].push({
            id: message.id,
            text: message.text,
            mine: message.mine,
            senderName: message.senderName,
            senderId: message.senderId,
            attachments: (message.attachments ?? [])
              .filter((attachment: LocalAttachment) => Boolean(attachment.storageKey))
              .map((attachment: LocalAttachment) => ({
                id: attachment.id,
                name: attachment.name,
                type: attachment.type,
                size: attachment.size,
                storageKey: attachment.storageKey,
              })),
            status: (message.status as ChatMessage["status"]) ??
              (message.mine ? "sent" : "delivered"),
            createdAt: message.createdAt,
            forwarded: message.forwarded,
          });
        });

        Object.values(grouped).forEach((items) =>
          items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        );
        setMessagesByConversation(grouped);
      } catch (error) {
        console.error("Failed to load local chat data:", error);
      } finally {
        if (!cancelled) setLocalDataLoaded(true);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [userId, setConversations, setMessagesByConversation, setLocalDataLoaded]);

  useEffect(() => {
    if (!userId || !localDataLoaded) return;

    const localConversations: LocalConversation[] = conversations.map((conversation) => ({
      ...conversation,
      userId,
      updatedAt: Date.now(),
    }));

    void localChatService.saveConversations(userId, localConversations).catch((error) => {
      console.error("Failed to save conversations:", error);
    });
  }, [conversations, userId, localDataLoaded]);

  useEffect(() => {
    if (!userId || !localDataLoaded) return;

    const localMessages: LocalChatMessage[] = [];
    Object.entries(messagesByConversation).forEach(([conversationId, items]) => {
      items.forEach((message) => {
        localMessages.push({
          id: String(message.id),
          userId,
          conversationId,
          senderId: message.senderId ?? userId,
          text: message.text,
          mine: message.mine,
          senderName: message.senderName,
          attachments: message.attachments,
          status: message.status,
          createdAt: message.createdAt ?? Date.now(),
          forwarded: message.forwarded,
        });
      });
    });

    void localChatService.saveMessages(userId, localMessages).catch((error) => {
      console.error("Failed to save messages:", error);
    });
  }, [messagesByConversation, userId, localDataLoaded]);
}
