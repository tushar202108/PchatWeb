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
  attachments?: LocalAttachment[];
  createdAt: number;
  status?: string;
  forwarded?: boolean;
  replyTo?: {
    messageId: string;
    senderName?: string;
    senderId?: string;
    mine: boolean;
  }
   deleted?: boolean;
  deletedForEveryone?: boolean;
  deletedAt?: number;
}

export interface LocalConversation {
  id: string;
  userId: string;
  name: string;
  lastMessage: string;
  unread?: number;
  archived?: boolean;
  username?: string;
  uniqueId?: string | number;
  email?: string;
  lastMessageAt?: number;
  groupId?: string;
  groupDescription?: string;
  groupImage?: string;
  isGroup?: boolean;
  updatedAt: number;
  pinnedMessages?: {
  messageId: string;
  pinnedAt: number;
}[];
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