
export const localChatService = {
  getConversations(userId: string) {
    return window.chatStorage.getConversations(userId);
  },

  saveConversations(userId: string, conversations: any[]) {
    return window.chatStorage.saveConversations(userId, conversations);
  },

  getMessages(userId: string, conversationId: string) {
    return window.chatStorage.getMessages(userId, conversationId);
  },

  getAllMessages(userId: string) {
    return window.chatStorage.getAllMessages(userId);
  },

  saveMessages(userId: string, messages: any[]) {
    return window.chatStorage.saveMessages(userId, messages);
  },
};
