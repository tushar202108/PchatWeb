
import { useCallback } from "react";
import { localChatService } from "../services/localChatService";
import { notificationService } from "../services/notificationService";

interface UseChatHandlersProps {
    user: any;
    connected: boolean;
    publish: (destination: string, payload: any) => void;

    conversationsRef: React.MutableRefObject<any[]>;
    selectedRef: React.MutableRefObject<any>;

    messagesByConversation: Record<string, any[]>;

    setMessagesByConversation: React.Dispatch<
        React.SetStateAction<Record<string, any[]>>
    >;

    setConversations: React.Dispatch<
        React.SetStateAction<any[]>
    >;

    setOnlineUsers: React.Dispatch<
        React.SetStateAction<string[]>
    >;

    setExistingOnlineUsers: React.Dispatch<
        React.SetStateAction<string[]>
    >;

    downloadIncomingAttachments: (
        received: any,
        conversationId: string
    ) => Promise<any[]>;
}

export const useChatHandlers = ({
    user,
    connected,
    publish,
    conversationsRef,
    selectedRef,
    messagesByConversation,
    setMessagesByConversation,
    setConversations,
    setOnlineUsers,
    setExistingOnlineUsers,
    downloadIncomingAttachments,
}: UseChatHandlersProps) => {

    const handleExistingUserStatus = useCallback(
        (members: string[]) => {
            console.log("Initial online members:", members);

            if (!Array.isArray(members)) {
                console.warn("Expected an array of online users:", members);
                return;
            }

            const normalizedUsers = members
                .map((id) => String(id).trim().toLowerCase())
                .filter(Boolean);

            setExistingOnlineUsers(normalizedUsers);
            setOnlineUsers(normalizedUsers);
        },
        [setExistingOnlineUsers, setOnlineUsers]
    );

    const handleUserStatus = useCallback(
        (status: any) => {
            console.log("Live user status:", status);

            const recipientId = String(
                status.recipientId ?? status.userId ?? ""
            ).trim().toLowerCase();

            if (!recipientId) return;

            const isOnline =
                status.online === true ||
                String(status.status).toUpperCase() === "ONLINE";

            setOnlineUsers((current) => {
                if (isOnline) {
                    return current.includes(recipientId)
                        ? current
                        : [...current, recipientId];
                }

                return current.filter((id) => id !== recipientId);
            });
        },
        [setOnlineUsers]
    );

    const publishReadAcknowledgement = useCallback(
        (
            acknowledgements: {
                messageId: string;
                senderId: string;
            }[],
            status: "DELIVERED" | "READ"
        ) => {
            if (!connected || !acknowledgements.length) return;

            const payload = acknowledgements.map((item) => ({
                messageId: item.messageId,
                status,
                readerId: String(user?.email ?? ""),
                senderId: item.senderId,
            }));

            console.log(`Publishing ${status} acknowledgement:`, payload);

            publish("/app/messages.ack", payload);
        },
        [connected, publish, user?.email]
    );

    const handleIncomingMessage = useCallback(
        async (received: any) => {
            console.log("Received WebSocket message:", received);

            // Handle Delete for everyone
            if (received.content === "This message was deleted") {
                const deletedMessageId = String(received.messageId);
                const currentUserId = String(user?.email ?? "");

                const matchedConversation = Object.entries(
                    messagesByConversation
                ).find(([, messages]) =>
                    messages.some(
                        (message: any) =>
                            String(message.id) === deletedMessageId
                    )
                );

                if (!matchedConversation) {
                    console.warn(
                        "Original message not found for deletion:",
                        deletedMessageId
                    );
                    return;
                }

                const [conversationId] = matchedConversation;

                try {
                    await localChatService.updateMessage(
                        currentUserId,
                        String(conversationId),
                        deletedMessageId,
                        {
                            text: "",
                            // text: "This message was deleted",
                            attachments: [],
                            deleted: true,
                            deletedForEveryone: true,
                            deletedAt: Date.now(),
                        }
                    );

                    setMessagesByConversation((current) => ({
                        ...current,
                        [conversationId]: (
                            current[conversationId] ?? []
                        ).map((message: any) =>
                            String(message.id) === deletedMessageId
                                ? {
                                    // ...message,
                                    // text: "This message was deleted",
                                    // attachments: [],
                                    // deleted: true,
                                    // deletedForEveryone: true,
                                    ...message,
                                    text: "",
                                    attachments: [],
                                    replyTo: undefined,
                                    replyToMessageId: undefined,
                                    deleted: true,
                                    deletedForEveryone: true,
                                    deletedAt: Date.now(),
                                }
                                : message
                        ),
                    }));

                    setConversations((current) =>
                        current.map((conversation) =>
                            String(conversation.id) === String(conversationId)
                                ? {
                                    ...conversation,
                                    lastMessage: "This message was deleted",
                                }
                                : conversation
                        )
                    );

                    console.log(
                        "Message deleted for everyone:",
                        deletedMessageId
                    );
                } catch (error) {
                    console.error(
                        "Failed to process received deletion:",
                        error
                    );
                }

                return;
            }

            const senderId = String(received.senderId ?? "").trim();
            const messageId = String(received.messageId ?? "").trim();
            const currentUserId = String(user?.email ?? "")
                .trim()
                .toLowerCase();

            if (!senderId || !messageId) {
                console.warn(
                    "Incoming message missing senderId/messageId:",
                    received
                );
                return;
            }

            // Ignore messages sent by the current user.
            if (senderId.toLowerCase() === currentUserId) {
                return;
            }

            const existingConversation = conversationsRef.current.find(
                (item) =>
                    String(item.username ?? "").trim().toLowerCase() ===
                    senderId.toLowerCase() ||
                    String(item.id).toLowerCase() === senderId.toLowerCase()
            );

            const conversation = existingConversation ?? {
                id: `incoming-${senderId.toLowerCase()}`,
                name: received.senderName || senderId,
                username: senderId,
                lastMessage: "",
                unread: 0,
            };

            const conversationId = conversation.id;

            const isConversationOpen =
                selectedRef.current?.id === conversationId;

            // Ignore duplicate messages.
            const alreadyExists = (
                messagesByConversation[conversationId] ?? []
            ).some((item) => String(item.id) === messageId);

            if (alreadyExists) {
                console.log("Duplicate message ignored:", messageId);
                return;
            }

            let downloadedAttachments: any[] = [];

            if (
                received.messageType === "ATTACHMENT" ||
                received.messageType === "FILE" ||
                received.file ||
                received.attachments?.length
            ) {
                downloadedAttachments = await downloadIncomingAttachments(
                    received,
                    conversationId
                );
            }

            const incomingMessage = {
                id: messageId,
                senderId,
                text: received.content ?? "",
                mine: false,
                senderName: received.senderName || conversation.name,
                status: isConversationOpen ? "read" : "delivered",
                attachments: downloadedAttachments,
                createdAt: received.sentAt
                    ? new Date(received.sentAt).getTime()
                    : Date.now(),
                forwarded: received.forwarded === true,
            };

            setMessagesByConversation((current) => {
                const existingMessages = current[conversationId] ?? [];

                if (
                    existingMessages.some(
                        (item) => String(item.id) === messageId
                    )
                ) {
                    return current;
                }

                return {
                    ...current,
                    [conversationId]: [
                        ...existingMessages,
                        incomingMessage,
                    ],
                };
            });

            const isAttachment =
                received.messageType === "ATTACHMENT" ||
                received.messageType === "FILE" ||
                !!received.file ||
                !!received.attachments?.length;

            const lastMessage = isAttachment
                ? "📎 Attachment"
                : received.content ?? "";

            setConversations((current) => {
                const exists = current.some(
                    (item) => item.id === conversationId
                );

                const updated = exists
                    ? current.map((item) =>
                        item.id === conversationId
                            ? {
                                ...item,
                                lastMessage,
                                lastMessageAt: incomingMessage.createdAt,
                                unread: isConversationOpen
                                    ? item.unread ?? 0
                                    : (item.unread ?? 0) + 1,
                            }
                            : item
                    )
                    : [
                        {
                            ...conversation,
                            lastMessage,
                            lastMessageAt: incomingMessage.createdAt,
                            unread: isConversationOpen ? 0 : 1,
                        },
                        ...current,
                    ];

                return updated.sort(
                    (a, b) =>
                        (b.lastMessageAt ?? 0) -
                        (a.lastMessageAt ?? 0)
                );
            });

            // --------------------------------------------
            // INCOMING MESSAGE NOTIFICATION + SOUND
            // --------------------------------------------

            const notificationBody = isAttachment
                ? "📎 Attachment"
                : String(incomingMessage.text || "").trim() ||
                "You received a new message";

            notificationService.notifyIncomingMessage(
                incomingMessage.senderName || "New message",
                notificationBody
            );

            // --------------------------------------------
            // DELIVERED / READ ACKNOWLEDGEMENTS
            // --------------------------------------------

            const acknowledgement = [
                {
                    messageId,
                    senderId,
                },
            ];

            if (connected) {
                publishReadAcknowledgement(
                    acknowledgement,
                    "DELIVERED"
                );
            }

            if (isConversationOpen && connected) {
                publishReadAcknowledgement(
                    acknowledgement,
                    "READ"
                );
            }
        },
        [
            user?.email,
            connected,
            conversationsRef,
            selectedRef,
            messagesByConversation,
            setMessagesByConversation,
            setConversations,
            downloadIncomingAttachments,
            publishReadAcknowledgement,
        ]
    );

    const handleUserAcknowledge = useCallback(
        (ack: any) => {
            console.log("Message acknowledgement:", ack);

            const acknowledgements = Array.isArray(ack) ? ack : [ack];

            const statusMap = new Map<
                string,
                "delivered" | "read"
            >();

            acknowledgements.forEach((item) => {
                const status = String(item.status ?? "").toUpperCase();

                const newStatus =
                    status === "READ"
                        ? "read"
                        : status === "DELIVERED"
                            ? "delivered"
                            : null;

                if (!newStatus) return;

                const ids = item.messageIds ??
                    (item.messageId ? [item.messageId] : []);

                ids.forEach((id: string) => {
                    statusMap.set(String(id), newStatus);
                });
            });

            if (!statusMap.size) return;

            setMessagesByConversation((current) => {
                const updated = { ...current };

                Object.keys(updated).forEach((conversationId) => {
                    updated[conversationId] = updated[conversationId].map(
                        (message) => {
                            if (!message.mine) return message;

                            const newStatus = statusMap.get(
                                String(message.id)
                            );

                            if (!newStatus) return message;

                            // Never downgrade READ to DELIVERED.
                            if (message.status === "read") return message;

                            return {
                                ...message,
                                status: newStatus,
                            };
                        }
                    );
                });

                return updated;
            });
        },
        [setMessagesByConversation]
    );

    const sendReadAcknowledgement = useCallback(
        (conversationId: string) => {
            const conversationMessages =
                messagesByConversation[conversationId] ?? [];

            const unreadMessages = conversationMessages.filter(
                (message) =>
                    !message.mine && message.status !== "read"
            );

            const unreadMessageIds = unreadMessages
                .map((message) => String(message.id))
                .filter(Boolean);

            if (!unreadMessageIds.length) return;

            const acknowledgements = unreadMessages.map((message) => ({
                messageId: String(message.id),
                senderId: String(message.senderId ?? ""),
            }));

            if (connected) {
                publishReadAcknowledgement(
                    acknowledgements,
                    "READ"
                );
            }

            setMessagesByConversation((current) => ({
                ...current,
                [conversationId]: (
                    current[conversationId] ?? []
                ).map((message) =>
                    !message.mine
                        ? { ...message, status: "read" }
                        : message
                ),
            }));

            console.log("Read message IDs:", unreadMessageIds);
        },
        [
            messagesByConversation,
            connected,
            publishReadAcknowledgement,
            setMessagesByConversation,
        ]
    );

    return {
        handleExistingUserStatus,
        handleUserStatus,
        publishReadAcknowledgement,
        handleIncomingMessage,
        handleUserAcknowledge,
        sendReadAcknowledgement,
    };
};
