export interface ChatMessage {
  id?: string;
  senderId: any;
  senderName: string;
  content: string;
  timestamp: string;
  chatRoomId?: string;
  chatId?: any;
}

export interface SendMessagePayload {
  chatRoomId: string;
  content: string;
  senderId: string;
}