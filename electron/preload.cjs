
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chatStorage", {
  saveConversations: (userId, conversations) =>
    ipcRenderer.invoke("chat:save-conversations", userId, conversations),

  getConversations: (userId) =>
    ipcRenderer.invoke("chat:get-conversations", userId),

  saveMessages: (userId, messages) =>
    ipcRenderer.invoke("chat:save-messages", userId, messages),

  getMessages: (userId, conversationId) =>
    ipcRenderer.invoke("chat:get-messages", userId, conversationId),

  getAllMessages: (userId) =>
    ipcRenderer.invoke("chat:get-all-messages", userId),
});
