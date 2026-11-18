
const normalizeMessageStatus = (messages: any[]) => {
  return messages.map((message) => ({
    ...message,
    status:
      message.status ??
      (message.mine ? "sent" : "delivered"),
  }));
};

export const localChatService = {
    getConversations(userId: string) {
        return window.chatStorage.getConversations(userId);
    },

    saveConversations(userId: string, conversations: any[]) {
        return window.chatStorage.saveConversations(userId, conversations);
    },

    async getMessages(userId: string, conversationId: string) {
        const message = await  window.chatStorage.getMessages(userId, conversationId);
        return normalizeMessageStatus(message);
    },

    async getAllMessages(userId: string) {
        const message = await window.chatStorage.getAllMessages(userId);
        return normalizeMessageStatus(message);
    },

    saveMessages(userId: string, messages: any[]) {
        return window.chatStorage.saveMessages(userId, messages);
    },
deleteConversation(userId: string, conversationId: string) {
  return window.chatStorage.deleteConversation(userId, conversationId);
},

deleteMessage(userId: string, conversationId: string, messageId: string) {
  return window.chatStorage.deleteMessage(userId, conversationId, messageId);
},
};
