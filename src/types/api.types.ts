export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  chatRoomId?: string;
}

export interface SendMessagePayload {
  chatRoomId: string;
  content: string;
  senderId: string;
}