export interface ChatMessage {
  id: string | number;
  text: string;
  mine: boolean;
  senderName?: string;
  senderId?: string;
  status?: "sent" | "delivered" | "read";
  attachments?: LocalAttachment[];
  createdAt?: number;
  deleted?: boolean;
  forwarded?: boolean;
  conversationId?: string;
  uploadStatus?: "uploading" | "uploaded" | "failed";
  replyToMessageId?: string;
  replyTo?: {
    messageId: string;
    text: string;
    senderName?: string;
    senderId?: string;
    mine: boolean;
    attachmentNames?: string[];
  };
  deletedForEveryone?: boolean;
  deletedAt?: number;
}
export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread?: number;
  archived?: boolean;
  username?: string;
  uniqueId?: any;
  email?: string;
  lastMessageAt?: number;
  groupId?: string;
  groupDescription?: string;
  groupImage?: string;
  isGroup?: boolean;
  pinnedMessages?: PinnedMessage[];
}
export type SidebarTab = "all" | "unread" | "archived";
export const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: "all", label: "All messages" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];
export const EMPTY_TEXT: Record<SidebarTab, string> = {
  all: "No conversations yet",
  unread: "No unread messages",
  archived: "No archived conversations",
};
export interface IncomingChatMessage {
  messageId: string | number;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: string;
  senderName?: string;
  attachments?: LocalAttachment[];
}
export const MIN_GROUP_MEMBERS = 2;
export interface PinnedMessage {
  messageId: string;
  pinnedAt: number;
}