import { useCallback } from "react";
import type { FormEvent } from "react";
import type { ChatMessage, Conversation, IncomingChatMessage } from "../../types/chats.type";
import { chatService } from "../../services/chatService";

type RetryAttachment = NonNullable<ChatMessage["attachments"]>[number];
interface Options {
  userEmail: string;
  userId: string;
  selected: Conversation | null;
  draft: string;
  attachments: File[];
  setDraft: (value: string) => void;
  setAttachments: (files: File[]) => void;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  setMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  publish: (destination: string, payload: unknown) => void;
  replyingTo: ChatMessage | null;
  setReplyingTo: React.Dispatch<
    React.SetStateAction<ChatMessage | null>
  >;
}

export function useChatMessages(options: Options) {
  const {
    userEmail, selected, draft, attachments,
    setDraft, setAttachments, setShowEmojiPicker,
    setMessagesByConversation, setConversations, publish, replyingTo,
    setReplyingTo,
  } = options;

  const downloadIncomingAttachments = useCallback(async (
    received: IncomingChatMessage,
    conversationId: string
  ) => {
    const raw = received as IncomingChatMessage & { file?: any; attachments?: any[] };
    const receivedFiles = Array.isArray(raw.attachments)
      ? raw.attachments
      : raw.file ? [raw] : [];

    if (!receivedFiles.length) {
      console.warn("No attachment found in WebSocket message:", received);
      return [];
    }

    const downloaded = await Promise.all(receivedFiles.map(async (item: any) => {
      const file = item.file ?? item;
      if (!file.downloadUrl) {
        console.warn("Missing downloadUrl:", file);
        return null;
      }

      try {
        const blob = await chatService.downloadAttachment(file.downloadUrl);
        const saved = await window.chatStorage.saveAttachment({
          userId: userEmail,
          conversationId,
          name: file.fileName,
          type: file.fileType,
          bytes: new Uint8Array(await blob.arrayBuffer()),
        });

        return {
          ...saved,
          id: String(file.fileId),
          name: file.fileName,
          type: file.fileType,
          size: file.fileSize,
        };
      } catch (error) {
        console.error("Attachment download failed:", error);
        return null;
      }
    }));

    return downloaded.filter(Boolean);
  }, [userEmail]);

  const sendMessage = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if ((!text && attachments.length === 0) || !selected) return;

    const messageId = crypto.randomUUID();
    const senderId = userEmail;
    const receiverId = String(selected.username ?? "");
    const conversationId = String(selected.id);
    const filesToUpload = [...attachments];
    const now = Date.now();

    const pendingAttachments: LocalAttachment[] = filesToUpload.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      storageKey: "",
      previewUrl: URL.createObjectURL(file),
      uploadProgress: 0,
      uploadStatus: "uploading",
    }));

    const newMessage: ChatMessage = {
      id: messageId,
      text,
      mine: true,
      status: "sent",
      attachments: pendingAttachments,
      createdAt: now,
      uploadStatus: filesToUpload.length ? "uploading" : "uploaded",

      ...(replyingTo && {
        replyToMessageId: String(replyingTo.id),
        replyTo: {
          messageId: String(replyingTo.id),
          text: replyingTo.text,
          senderName: replyingTo.senderName,
          senderId: replyingTo.senderId,
          mine: replyingTo.mine,
          attachmentNames: (replyingTo.attachments ?? []).map(
            (attachment) => attachment.name
          ),
        },
      }),
    };

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), newMessage],
    }));

    setConversations((current) => current
      .map((conversation) => String(conversation.id) === conversationId
        ? { ...conversation, lastMessage: text || `📎 ${filesToUpload.length} attachment(s)`, lastMessageAt: now }
        : conversation)
      .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0))
    );

    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);
    setReplyingTo(null);
    if (text) {
      publish("/app/chat.send", {
        messageId,
        senderId,
        receiverId,
        content: text,
        messageType: "TEXT",
        attachments: [],
        ...(replyingTo && {
          replyToMessageId: String(replyingTo.id),
          replyTo: {
            messageId: String(replyingTo.id),
            text: replyingTo.text,
            senderName: replyingTo.senderName,
            senderId: replyingTo.senderId,
            mine: replyingTo.mine,
            attachmentNames: (replyingTo.attachments ?? []).map(
              (attachment) => attachment.name
            ),
          },
        }),
      });
    }
    if (!filesToUpload.length) return;

    try {
      const results = await Promise.allSettled(filesToUpload.map(async (file, index) => {
        const temporaryId = pendingAttachments[index].id;

        await chatService.sendAttachment(receiverId, file, messageId, (progress) => {
          setMessagesByConversation((current) => ({
            ...current,
            [conversationId]: (current[conversationId] ?? []).map((message) =>
              String(message.id) === messageId ? {
                ...message,
                attachments: (message.attachments ?? []).map((attachment) =>
                  attachment.id === temporaryId ? { ...attachment, uploadProgress: progress } : attachment
                ),
              } : message
            ),
          }));
        });

        const saved = await window.chatStorage.saveAttachment({
          userId: senderId,
          conversationId,
          name: file.name,
          type: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
        });

        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: (current[conversationId] ?? []).map((message) =>
            String(message.id) === messageId ? {
              ...message,
              attachments: (message.attachments ?? []).map((attachment) =>
                attachment.id === temporaryId
                  ? { ...saved, uploadProgress: 100, uploadStatus: "uploaded" as const }
                  : attachment
              ),
            } : message
          ),
        }));
        URL.revokeObjectURL(pendingAttachments[index].previewUrl ?? "");
        return saved;
      }));

      const hasFailed = results.some((result) => result.status === "rejected");
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((message) =>
          String(message.id) === messageId ? {
            ...message,
            uploadStatus: hasFailed ? "failed" : "uploaded",
            attachments: (message.attachments ?? []).map((attachment) =>
              attachment.uploadStatus === "uploading"
                ? { ...attachment, uploadStatus: "failed" as const }
                : attachment
            ),
          } : message
        ),
      }));
    } catch (error) {
      console.error("Attachment upload failed:", error);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((message) =>
          String(message.id) === messageId ? { ...message, uploadStatus: "failed" } : message
        ),
      }));
    }
  }, [
    attachments, draft, publish, selected, setAttachments, setConversations,
    setDraft, setMessagesByConversation, setShowEmojiPicker, userEmail, replyingTo,
    setReplyingTo,
  ]);

  const handleRetryAttachment = useCallback(
    async (failedFiles: RetryAttachment[], message: ChatMessage) => {
      if (!selected || !failedFiles.length) return;

      const messageId = String(message.id);
      const conversationId = String(selected.id);
      const receiverId = String(selected.username ?? "");
      const senderId = userEmail;

      // Mark all failed attachments as uploading.
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((item) =>
          String(item.id) === messageId
            ? {
              ...item,
              uploadStatus: "uploading",
              attachments: (item.attachments ?? []).map((attachment) =>
                failedFiles.some((failed) => failed.id === attachment.id)
                  ? {
                    ...attachment,
                    uploadStatus: "uploading" as const,
                    uploadProgress: 0,
                  }
                  : attachment
              ),
            }
            : item
        ),
      }));

      await Promise.allSettled(
        failedFiles.map(async (attachment) => {
          const item = attachment as any;
          let file: File;

          try {
            // Recover original File/Blob if it is still available.
            if (item.file instanceof File) {
              file = item.file;
            } else if (item.file instanceof Blob) {
              file = new File(
                [item.file],
                item.name,
                { type: item.type }
              );
            } else if (item.previewUrl) {
              // Recover bytes from the existing local blob preview.
              const response = await fetch(item.previewUrl);

              if (!response.ok) {
                throw new Error("Unable to recover image bytes");
              }

              const blob = await response.blob();

              file = new File(
                [blob],
                item.name || "Attachment",
                { type: item.type || blob.type }
              );
            } else {
              throw new Error("Original attachment file is unavailable");
            }

            // Reuse the existing upload API.
            await chatService.sendAttachment(
              receiverId,
              file,
              messageId,
              (progress) => {
                setMessagesByConversation((current) => ({
                  ...current,
                  [conversationId]: (current[conversationId] ?? []).map(
                    (item) =>
                      String(item.id) === messageId
                        ? {
                          ...item,
                          attachments: (item.attachments ?? []).map(
                            (currentAttachment) =>
                              currentAttachment.id === attachment.id
                                ? {
                                  ...currentAttachment,
                                  uploadProgress: progress,
                                }
                                : currentAttachment
                          ),
                        }
                        : item
                  ),
                }));
              }
            );

            // Save successfully uploaded attachment locally.
            const saved = await window.chatStorage.saveAttachment({
              userId: senderId,
              conversationId,
              name: file.name,
              type: file.type,
              bytes: new Uint8Array(await file.arrayBuffer()),
            });

            setMessagesByConversation((current) => ({
              ...current,
              [conversationId]: (current[conversationId] ?? []).map(
                (item) =>
                  String(item.id) === messageId
                    ? {
                      ...item,
                      attachments: (item.attachments ?? []).map(
                        (currentAttachment) =>
                          currentAttachment.id === attachment.id
                            ? {
                              ...saved,
                              uploadProgress: 100,
                              uploadStatus: "uploaded" as const,
                            }
                            : currentAttachment
                      ),
                    }
                    : item
              ),
            }));

            if (item.previewUrl?.startsWith("blob:")) {
              URL.revokeObjectURL(item.previewUrl);
            }
          } catch (error) {
            console.error(
              `Retry failed for ${item.name}:`,
              error
            );

            setMessagesByConversation((current) => ({
              ...current,
              [conversationId]: (current[conversationId] ?? []).map(
                (item) =>
                  String(item.id) === messageId
                    ? {
                      ...item,
                      attachments: (item.attachments ?? []).map(
                        (currentAttachment) =>
                          currentAttachment.id === attachment.id
                            ? {
                              ...currentAttachment,
                              uploadStatus: "failed" as const,
                            }
                            : currentAttachment
                      ),
                    }
                    : item
              ),
            }));
          }
        })
      );

      // Update overall message upload status after all retries finish.
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] ?? []).map((item) => {
          if (String(item.id) !== messageId) return item;

          const statuses = (item.attachments ?? []).map(
            (attachment) => attachment.uploadStatus
          );

          return {
            ...item,
            uploadStatus: statuses.some((status) => status === "failed")
              ? "failed"
              : statuses.some((status) => status === "uploading")
                ? "uploading"
                : "uploaded",
          };
        }),
      }));
    },
    [selected, userEmail, setMessagesByConversation]
  );


  return { sendMessage, downloadIncomingAttachments, handleRetryAttachment };
}
