export interface ChatMessage {
  id: string | number;
  text: string;
  mine: boolean;
  senderName?: string;

  status?: "sent" | "delivered" | "read";
}
export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread?: number;
  archived?: boolean;
  username?: string;
}

 export interface ChatMessage {
  id: string | number;
  text: string;
  mine: boolean;
  senderName?: string;
  attachments?: File[];
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
}
export const MIN_GROUP_MEMBERS = 2;