import { useCallback } from "react";
import type { ChatMessage, Conversation } from "../../types/chats.type";
import { chatService } from "../../services/chatService";
import { localChatService } from "../../services/localChatService";

interface Options {
  userEmail: string;
  publish: (destination: string, payload: unknown) => void;
  setMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

export function useChatForwarding({
  userEmail, publish, setMessagesByConversation, setConversations,
}: Options) {
  const forwardMessageToConversation = useCallback(async (
    sourceMessage: ChatMessage,
    target: Conversation
  ) => {
    if (!sourceMessage || !target) return;
    if (sourceMessage.deleted) throw new Error("Deleted messages cannot be forwarded");

    const messageId = crypto.randomUUID();
    const senderId = userEmail.trim();
    const receiverId = String(target.username ?? "").trim();
    const conversationId = String(target.id);

    if (!senderId || !receiverId) throw new Error("Sender or recipient information is missing");

    const forwardedAttachments = await Promise.all((sourceMessage.attachments ?? []).map(async (attachment) => {
      const dataUrl = await window.chatStorage.getAttachment(attachment.storageKey);
      if (!dataUrl) throw new Error(`Attachment not found: ${attachment.name}`);

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], attachment.name, { type: attachment.type || blob.type });

      await chatService.sendAttachment(receiverId, file, messageId);
      return window.chatStorage.saveAttachment({
        userId: senderId,
        conversationId,
        name: file.name,
        type: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      });
    }));

    const forwarded: ChatMessage = {
      id: messageId,
      text: sourceMessage.text ?? "",
      mine: true,
      senderId,
      status: "sent",
      attachments: forwardedAttachments,
      createdAt: Date.now(),
      forwarded: true,
      conversationId,
    };

    await localChatService.saveMessages(senderId, [{
      id: messageId,
      userId: senderId,
      conversationId,
      senderId,
      text: forwarded.text,
      mine: true,
      attachments: forwardedAttachments,
      createdAt: forwarded.createdAt!,
      status: "sent",
      forwarded: true,
    }]);

    publish("/app/chat.send", {
      messageId,
      senderId,
      receiverId,
      content: sourceMessage.text ?? "",
      messageType: "TEXT",
      forwarded: true,
      attachments: forwardedAttachments.map((attachment) => ({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        storageKey: attachment.storageKey,
      })),
    });

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), forwarded],
    }));

    setConversations((current) => current
      .map((conversation) => String(conversation.id) === conversationId
        ? {
          ...conversation,
          lastMessage: sourceMessage.text || `📎 ${forwardedAttachments.length} attachment(s)`,
          lastMessageAt: forwarded.createdAt,
        }
        : conversation)
      .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0))
    );

    return forwarded;
  }, [publish, setConversations, setMessagesByConversation, userEmail]);

  return { forwardMessageToConversation };
}
