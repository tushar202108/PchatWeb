
import { useCallback, useEffect, useState } from "react";
import type { MessageDto } from "../services/chatService";
import { chatService } from "../services/chatService";
import { messageRepository } from "../repo/messagerepo";

export function useChatMessages(
  userId: string,
  chatId: string
) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!userId || !chatId) return;

    setLoading(true);

    try {
      // 1. Load local messages immediately
      const cachedMessages =
        await messageRepository.getMessages(userId, chatId);

      setMessages(cachedMessages);

      // 2. Fetch latest messages from backend
      const serverMessages: MessageDto[] =
        await chatService.getMessages(chatId);

      // 3. Merge server messages with local metadata
      const localMessageMap = new Map(
        cachedMessages.map((message) => [
          String(message.id),
          message,
        ])
      );

      const mergedMessages = serverMessages.map((serverMessage) => {
        const localMessage = localMessageMap.get(
          String(serverMessage.id)
        );

        return {
          ...localMessage,
          ...serverMessage,

          // Preserve local forwarded flag if backend doesn't return it
          forwarded:
            serverMessage.forwarded ??
            localMessage?.forwarded ??
            false,
        };
      });

      // 4. Save merged messages locally
      await messageRepository.saveMessages(
        userId,
        mergedMessages
      );

      // 5. Read updated local messages
      const updatedMessages =
        await messageRepository.getMessages(userId, chatId);

      setMessages(updatedMessages);
    } catch (error) {
      console.error("Message synchronization failed:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, chatId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Save an incoming or server-confirmed message
  const addMessage = async (message: MessageDto) => {
    await messageRepository.saveMessage(userId, message);

    const updatedMessages =
      await messageRepository.getMessages(userId, chatId);

    setMessages(updatedMessages);
  };

  return {
    messages,
    loading,
    refreshMessages: loadMessages,
    addMessage,
  };
}
