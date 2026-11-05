
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

      // 3. Save latest server messages locally
      await messageRepository.saveMessages(
        userId,
        serverMessages
      );

      // 4. Read updated local messages
      const updatedMessages =
        await messageRepository.getMessages(userId, chatId);

      setMessages(updatedMessages);
    } catch (error) {
      console.error("Message synchronization failed:", error);
      // Keep cached messages available if API fails.
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
