import type { ChatMessage } from "./chats.type";

export type RetryAttachment = NonNullable<ChatMessage["attachments"]>[number];

export interface Props {
  messages: ChatMessage[];
  conversationImages: any[];
  onDeleteMessageEveryOne: (message: ChatMessage) => void;
  noMessagesText: string;
  wallpaperUrl?: string;
  selectedMessageIds: string[];
  onToggleMessageSelection: (message: ChatMessage) => void;
  onRetryAttachment?: (
    files: RetryAttachment[],
    message: ChatMessage
  ) => void;
  onReplyMessage?: (message: ChatMessage) => void;
  onCopyMessages: (messages: ChatMessage[]) => void;
  onForwardMessages: (messages: ChatMessage[]) => void;
  onDeleteMessages: (messages: ChatMessage[]) => void;
  pinnedMessageIds: string[];
  onPinMessage: (message: ChatMessage) => void;
  onUnpinMessage: (message: ChatMessage) => void;
}

export function getMessageDate(
  value?: number | string
): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) {
    return "Today";
  }

  if (getDateKey(date) === getDateKey(yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getTimeLabel(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function isImageFile(file: {
  type?: string;
  name?: string;
}): boolean {
  if (file.type?.startsWith("image/")) {
    return true;
  }

  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(
    file.name ?? ""
  );
}