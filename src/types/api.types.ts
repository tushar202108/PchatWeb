export interface ChatMessage {
  id?: string;
  senderId: any;
  senderName: string;
  content: string;
  timestamp: string;
  chatRoomId?: string;
  chatId?: any;
  createdAt?: number | string;
}

export interface SendMessagePayload {
  chatRoomId: string;
  content: string;
  senderId: string;
}