
import { chatDB, type LocalChatMessage } from "../DataStorage/chatStorage";
import type { MessageDto } from "../services/chatService";

export const messageRepository = {
  // Save one message
  async saveMessage(userId: string, message: MessageDto) {
    const localMessage: LocalChatMessage = {
      id: String(message.id),
      userId,
      chatId: String(message.chatId),
      senderId: String(message.senderId),
      text: message.text,
      createdAt: Number(message.createdAt),
      status: "sent",
    };

    await chatDB.messages.put(localMessage);

    return localMessage;
  },

  // Save multiple messages
  async saveMessages(userId: string, messages: MessageDto[]) {
    const localMessages: LocalChatMessage[] = messages.map((message) => ({
      id: String(message.id),
      userId,
      chatId: String(message.chatId),
      senderId: String(message.senderId),
      text: message.text,
      createdAt: message.createdAt,
      status: "sent",
    }));

    await chatDB.messages.bulkPut(localMessages);

    return localMessages;
  },

  // Get messages from local database
  async getMessages(userId: string, chatId: string) {
    return chatDB.messages
      .where("[userId+chatId]")
      .equals([userId, chatId])
      .sortBy("createdAt");
  },

  // Delete a conversation's local messages
  async deleteMessages(userId: string, chatId: string) {
    await chatDB.messages
      .where("[userId+chatId]")
      .equals([userId, chatId])
      .delete();
  },

  // Clear all messages belonging to a user
  async clearUserMessages(userId: string) {
    await chatDB.messages
      .where("userId")
      .equals(userId)
      .delete();
  },
};
