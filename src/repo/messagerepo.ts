import { chatDB, type LocalChatMessage } from "../DataStorage/chatStorage";
import type { MessageDto } from "../services/chatService";

const toTimestamp = (createdAt: string): number => {
  const numericValue = Number(createdAt);

  if (createdAt.trim() !== "" && Number.isFinite(numericValue)) {
    return numericValue;
  }

  const timestamp = Date.parse(createdAt);

  return Number.isNaN(timestamp) ? Date.now() : timestamp;
};

const toMessageDto = (message: LocalChatMessage): MessageDto => ({
  id: message.id,
  chatId: message.conversationId,
  senderId: message.senderId,
  text: message.text,
  createdAt: new Date(message.createdAt).toISOString(),
  status: message.status ?? "sent",
});

const toLocalMessage = (
  userId: string,
  message: MessageDto
): LocalChatMessage => ({
  id: String(message.id),
  userId,
  conversationId: String(message.chatId),
  senderId: String(message.senderId),
  text: message.text,
  createdAt: toTimestamp(message.createdAt),
  mine: String(message.senderId) === String(userId),
  status: message.status || "sent",
});

export const messageRepository = {
  async saveMessage(userId: string, message: MessageDto) {
    const localMessage = toLocalMessage(userId, message);

    await chatDB.messages.put(localMessage);

    return toMessageDto(localMessage);
  },

  async saveMessages(userId: string, messages: MessageDto[]) {
    const localMessages = messages.map((message) =>
      toLocalMessage(userId, message)
    );

    await chatDB.messages.bulkPut(localMessages);

    return localMessages.map(toMessageDto);
  },

  async getMessages(
    userId: string,
    conversationId: string
  ): Promise<MessageDto[]> {
    const messages = await chatDB.messages
      .where("[userId+conversationId]")
      .equals([userId, conversationId])
      .sortBy("createdAt");

    return messages.map(toMessageDto);
  },

  async deleteMessages(userId: string, conversationId: string) {
    await chatDB.messages
      .where("[userId+conversationId]")
      .equals([userId, conversationId])
      .delete();
  },

  async clearUserMessages(userId: string) {
    await chatDB.messages
      .where("userId")
      .equals(userId)
      .delete();
  },
};