import type { LocalChatMessage, LocalConversation } from "../DataStorage/chatStorage";

const normalizeMessageStatus = (messages: LocalChatMessage[]) => {
  return messages.map((message) => ({
    ...message,
    status: message.status ?? (message.mine ? "sent" : "delivered"),
  }));
};

export const localChatService = {
  getConversations(userId: string): Promise<LocalConversation[]> {
    return window.chatStorage.getConversations(userId);
  },

  saveConversations(userId: string, conversations: LocalConversation[]) {
    return window.chatStorage.saveConversations(userId, conversations);
  },

  async getMessages(userId: string, conversationId: string) {
    const messages = await window.chatStorage.getMessages(userId, conversationId);
    return normalizeMessageStatus(messages);
  },

  async getAllMessages(userId: string) {
    const messages = await window.chatStorage.getAllMessages(userId);
    return normalizeMessageStatus(messages);
  },

  saveMessages(userId: string, messages: LocalChatMessage[]) {
    return window.chatStorage.saveMessages(userId, messages);
  },

  deleteConversation(userId: string, conversationId: string) {
    return window.chatStorage.deleteConversation(userId, conversationId);
  },

  deleteMessage(userId: string, conversationId: string, messageId: string) {
    return window.chatStorage.deleteMessage(userId, conversationId, messageId);
  },

  updateMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    updates: Record<string, unknown>
  ) {
    return window.chatStorage.updateMessage(userId, conversationId, messageId, updates);
  },
   clearMessages(userId: string, conversationId: string) {
  return window.chatStorage.clearMessages(
    userId,
    conversationId
  );
},
};
