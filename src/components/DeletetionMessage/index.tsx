
import { useCallback, useState } from "react";
import { Button, Modal, message as antdMessage } from "antd";
import {
    DeleteOutlined,
    CloseOutlined,
} from "@ant-design/icons";

import type { ChatMessage } from "../../types/chats.type";
import { localChatService } from "../../services/localChatService";

interface DeletionMessageProps {
    userId: string;
    conversationId: string;
    recipientId: string;
    publish: (destination: string, payload: any) => void;
    onMessageDeleted: (
        messageId: string | number,
        deletedForEveryone: boolean
    ) => void;
}

export const useDeletionMessage = ({
    userId,
    conversationId,
    recipientId,
    publish,
    onMessageDeleted,
}: DeletionMessageProps) => {

    const [visible, setVisible] = useState(false);
    const [everyoneConfirm, setEveryoneConfirm] = useState(false);
    const [currentMessage, setCurrentMessage] =
        useState<ChatMessage | null>(null);
    const [loading, setLoading] = useState(false);

    const isMyMessage = currentMessage?.mine === true;

    const handleDeleteMessage = useCallback(
        (chatMessage: ChatMessage) => {
            setCurrentMessage(chatMessage);
            setEveryoneConfirm(false);
            setVisible(true);
        },
        []
    );

    const closeModal = () => {
        if (loading) return;

        setVisible(false);
        setEveryoneConfirm(false);
        setCurrentMessage(null);
    };

    const deleteMessageForMe = async () => {
        if (!currentMessage) return;

        try {
            setLoading(true);

            await localChatService.deleteMessage(
                userId,
                conversationId,
                String(currentMessage.id)
            );

            onMessageDeleted(currentMessage.id, false);

            antdMessage.success("Message deleted successfully");

            setVisible(false);
            setCurrentMessage(null);
        } catch (error) {
            console.error("Delete message for me failed:", error);
            antdMessage.error("Unable to delete message");
        } finally {
            setLoading(false);
        }
    };


    const deleteMessageForEveryone = async () => {
        if (!currentMessage || !currentMessage.mine) return;

        try {
            setLoading(true);

            const deletedAt = Date.now();

            const deletionPayload = {
                messageId: String(currentMessage.id),
                senderId: userId,
                receiverId: recipientId,
                content: "This message was deleted",
                messageType: "TEXT",
                attachments: [],
            };

            console.log("Publishing deleted message:", deletionPayload);

            publish("/app/chat.send", deletionPayload);
            await localChatService.updateMessage(
                userId,
                conversationId,
                String(currentMessage.id),
                {
                    text: "This message was deleted",
                    attachments: [],
                    deleted: true,
                    deletedForEveryone: true,
                    deletedAt,
                }
            );

            // Publish deletion to recipient.
            publish("/app/chat.send", deletionPayload);

            onMessageDeleted(currentMessage.id, true);

            antdMessage.success("Message deleted for everyone");

            setVisible(false);
            setCurrentMessage(null);
        } catch (error) {
            console.error("Delete message for everyone failed:", error);
            antdMessage.error("Unable to delete message");
        } finally {
            setLoading(false);
        }
    };


    const deletionModal = (
        <Modal
            open={visible}
            centered
            title={
                everyoneConfirm
                    ? "Delete for everyone?"
                    : "Delete message?"
            }
            onCancel={closeModal}
            closable={!loading}
            maskClosable={!loading}
            footer={
                <div className="delete-message-modal-footer">
                    {everyoneConfirm ? (
                        <>
                            <Button
                                onClick={() => setEveryoneConfirm(false)}
                                disabled={loading}
                            >
                                Back
                            </Button>

                            <Button
                                danger
                                type="primary"
                                loading={loading}
                                icon={<CloseOutlined />}
                                onClick={deleteMessageForEveryone}
                            >
                                Confirm delete
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </Button>

                            <Button
                                className="delete-for-me-btn"
                                loading={loading}
                                icon={<DeleteOutlined />}
                                onClick={deleteMessageForMe}
                            >
                                Delete for me
                            </Button>

                            {isMyMessage && (
                                <Button
                                    danger
                                    type="primary"
                                    disabled={loading}
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                        setEveryoneConfirm(true)
                                    }
                                >
                                    Delete for everyone
                                </Button>
                            )}
                        </>
                    )}
                </div>
            }
        >
            {everyoneConfirm ? (
                <p>
                    This message will be deleted for everyone.
                    Are you sure?
                </p>
            ) : (
                <p>Choose how you want to delete this message.</p>
            )}
        </Modal>
    );

    return {
        handleDeleteMessage,
        deletionModal,
    };
};
