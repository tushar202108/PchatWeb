import Dexie, { type Table } from "dexie";

export interface LocalChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  senderId: string;
  text: string;
  updatedMessages?: any;
  mine: boolean;
  senderName?: string;
  attachments?: File[];
  createdAt: number;
  status?: string;
}

export interface LocalConversation {
  id: string;
  userId: string;
  name: string;
  lastMessage: string;
  unread?: number;
  archived?: boolean;
  updatedAt: number;
}

class ChatDatabase extends Dexie {
  messages!: Table<LocalChatMessage>;
  conversations!: Table<LocalConversation>;

  constructor() {
    super("pChatsDatabase");

    this.version(1).stores({
      messages: "[userId+conversationId+id], [userId+conversationId]",
      conversations: "[userId+id], userId",
    });
  }
}

export const chatDB = new ChatDatabase();