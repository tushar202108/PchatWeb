import { axiosService } from "../Axios/axiosService";
import API from "./APIEndpoint";

export interface ContactDto {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  email: string;
  uniqueId: number;
  username: string;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: string;
}
export const chatService = {
  async getContacts(userId: string) {
    const { data } = await axiosService.post<ContactDto[]>(
      API.GetAllProfile,
      {},
      {
        params: {
          id: userId || 0,
        },
      }
    );
    return data;
  },
  async getMessages(chatId: string) {
    const { data } = await axiosService.get<MessageDto[]>(
      `${API.GET_MESSAGES}/${encodeURIComponent(chatId)}/messages`
    );

    return data;
  },

  async sendMessage(chatId: string, text: string) {
    const { data } = await axiosService.post<MessageDto>(
      `${API.SEND_MESSAGE}/${encodeURIComponent(chatId)}/messages`,
      { text }
    );

    return data;
  },


async sendAttachment(receiverId: string, file: File ,messageId: string) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("receiverId", receiverId);
  formData.append("messageId", messageId);

  const { data } = await axiosService.post(
  API.sendAttachment,
  formData,
   {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
  
);

  return data;
},
async downloadAttachment(downloadUrl: string) {
   const normalizedUrl = downloadUrl.replace(/^\/api(?=\/)/, "");
  const { data } = await axiosService.get(normalizedUrl, {
    responseType: "blob",
  });

  return data as Blob;
}
};