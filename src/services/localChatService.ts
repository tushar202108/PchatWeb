
import { chatDB, type LocalChatMessage, type LocalConversation } from "../DataStorage/chatStorage";

export const localChatService = {
  async getConversations(userId: string) {
    return chatDB.conversations
      .where("userId")
      .equals(userId)
      .toArray();
  },

  async saveConversations(conversations: LocalConversation[]) {
    if (!conversations.length) return;
    await chatDB.conversations.bulkPut(conversations);
  },

  async getAllMessages(userId: string) {
    return chatDB.messages
      .where("userId")
      .equals(userId)
      .toArray();
  },

  async getMessages(userId: string, conversationId: string) {
    return chatDB.messages
      .where("[userId+conversationId]")
      .equals([userId, conversationId])
      .toArray();
  },

  async saveMessages(messages: LocalChatMessage[]) {
    if (!messages.length) return;
    await chatDB.messages.bulkPut(messages);
  },

  async saveMessage(message: LocalChatMessage) {
    await chatDB.messages.put(message);
  },
};
