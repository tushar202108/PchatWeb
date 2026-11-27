
// import { useCallback, useState } from "react";
// import { Button, Modal, message as antdMessage } from "antd";
// import {
//     DeleteOutlined,
//     CloseOutlined,
// } from "@ant-design/icons";

// import type { ChatMessage } from "../../types/chats.type";
// import { localChatService } from "../../services/localChatService";

// interface DeletionMessageProps {
//     userId: string;
//     conversationId: string;
//     recipientId: string;
//     publish: (destination: string, payload: any) => void;
//     onMessageDeleted: (
//         messageId: string | number,
//         deletedForEveryone: boolean
//     ) => void;
// }

// export const useDeletionMessage = ({
//     userId,
//     conversationId,
//     recipientId,
//     publish,
//     onMessageDeleted,
// }: DeletionMessageProps) => {

//     const [visible, setVisible] = useState(false);
//     const [everyoneConfirm, setEveryoneConfirm] = useState(false);
//     const [currentMessage, setCurrentMessage] =
//         useState<ChatMessage | null>(null);
//     const [loading, setLoading] = useState(false);

//     const isMyMessage = currentMessage?.mine === true;

//     const handleDeleteMessage = useCallback(
//         (chatMessage: ChatMessage) => {
//             setCurrentMessage(chatMessage);
//             setEveryoneConfirm(false);
//             setVisible(true);
//         },
//         []
//     );

//     const closeModal = () => {
//         if (loading) return;

//         setVisible(false);
//         setEveryoneConfirm(false);
//         setCurrentMessage(null);
//     };

//     const deleteMessageForMe = async () => {
//         if (!currentMessage) return;

//         try {
//             setLoading(true);

//             await localChatService.deleteMessage(
//                 userId,
//                 conversationId,
//                 String(currentMessage.id)
//             );

//             onMessageDeleted(currentMessage.id, false);

//             antdMessage.success("Message deleted successfully");

//             setVisible(false);
//             setCurrentMessage(null);
//         } catch (error) {
//             console.error("Delete message for me failed:", error);
//             antdMessage.error("Unable to delete message");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const deleteMessageForEveryone = async () => {
//         if (!currentMessage || !currentMessage.mine) return;

//         try {
//             setLoading(true);

//             const deletedAt = Date.now();

//             const deletionPayload = {
//                 messageId: String(currentMessage.id),
//                 senderId: userId,
//                 receiverId: recipientId,
//                 content: "This message was deleted",
//                 messageType: "TEXT",
//                 attachments: [],
//             };

//             console.log("Publishing deleted message:", deletionPayload);

//             publish("/app/chat.send", deletionPayload);
//             await localChatService.updateMessage(
//                 userId,
//                 conversationId,
//                 String(currentMessage.id),
//                 {
//                     text: "This message was deleted",
//                     attachments: [],
//                     deleted: true,
//                     deletedForEveryone: true,
//                     deletedAt,
//                 }
//             );

//             // Publish deletion to recipient.
//             publish("/app/chat.send", deletionPayload);

//             onMessageDeleted(currentMessage.id, true);

//             antdMessage.success("Message deleted for everyone");

//             setVisible(false);
//             setCurrentMessage(null);
//         } catch (error) {
//             console.error("Delete message for everyone failed:", error);
//             antdMessage.error("Unable to delete message");
//         } finally {
//             setLoading(false);
//         }
//     };


//     const deletionModal = (
//         <Modal
//             open={visible}
//             centered
//             title={
//                 everyoneConfirm
//                     ? "Delete for everyone?"
//                     : "Delete message?"
//             }
//             onCancel={closeModal}
//             closable={!loading}
//             maskClosable={!loading}
//             style={{
//                 container:{
//                     background:"transparent"
//                 }
//             }as any}
//             footer={
//                 <div className="delete-message-modal-footer">
//                     {everyoneConfirm ? (
//                         <>
//                             <Button
//                                 onClick={() => setEveryoneConfirm(false)}
//                                 disabled={loading}
//                             >
//                                 Back
//                             </Button>

//                             <Button
//                                 danger
//                                 type="primary"
//                                 loading={loading}
//                                 icon={<CloseOutlined />}
//                                 onClick={deleteMessageForEveryone}
//                             >
//                                 Confirm delete
//                             </Button>
//                         </>
//                     ) : (
//                         <>
//                             <Button
//                                 onClick={closeModal}
//                                 disabled={loading}
//                             >
//                                 Cancel
//                             </Button>
//                             {isMyMessage && (
//                                 <Button
//                                     danger
//                                     type="primary"
//                                     disabled={loading}
//                                     icon={<DeleteOutlined />}
//                                     onClick={() =>
//                                         setEveryoneConfirm(true)
//                                     }
//                                 >
//                                     Delete for everyone
//                                 </Button>
//                             )}
//                         </>
//                     )}
//                 </div>
//             }
//         >
//             {everyoneConfirm ? (
//                 <p>
//                     This message will be deleted for everyone.
//                     Are you sure?
//                 </p>
//             ) : (
//                 <p>Are you sure to delete this message.</p>
//             )}
//         </Modal>
//     );

//     return {
//         handleDeleteMessage,
//         deletionModal,
//     };
// };

import { useCallback, useState } from "react";
import { Button, Modal, Space, message as antdMessage } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

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
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const isMyMessage = currentMessage?.mine === true;

  const handleDeleteMessage = useCallback((chatMessage: ChatMessage) => {
    setCurrentMessage(chatMessage);
    setEveryoneConfirm(false);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    if (loading) return;
    setVisible(false);
    setEveryoneConfirm(false);
    setCurrentMessage(null);
  }, [loading]);

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
      setEveryoneConfirm(false);
      setCurrentMessage(null);
    } catch (error) {
      console.error("Delete message for me failed:", error);
      antdMessage.error("Unable to delete message");
    } finally {
      setLoading(false);
    }
  };

  const deleteMessageForEveryone = async () => {
    if (!currentMessage || !isMyMessage) return;

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

      publish("/app/chat.send", deletionPayload);
      onMessageDeleted(currentMessage.id, true);
      antdMessage.success("Message deleted for everyone");

      setVisible(false);
      setEveryoneConfirm(false);
      setCurrentMessage(null);
    } catch (error) {
      console.error("Delete message for everyone failed:", error);
      antdMessage.error("Unable to delete message");
    } finally {
      setLoading(false);
    }
  };

  const renderFooter = () => {
    if (isMyMessage && !everyoneConfirm) {
      return (
        <Space wrap size={10}>
          <Button
            className="delete-modal-cancel-btn"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="delete-modal-cancel-btn"
            onClick={deleteMessageForMe}
            loading={loading}
          >
            Delete for me
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            className="delete-modal-confirm-btn"
            onClick={() => setEveryoneConfirm(true)}
            disabled={loading}
          >
            Delete for everyone
          </Button>
        </Space>
      );
    }

    if (isMyMessage && everyoneConfirm) {
      return (
        <Space wrap size={10}>
          <Button
            className="delete-modal-cancel-btn"
            onClick={() => setEveryoneConfirm(false)}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            className="delete-modal-confirm-btn"
            onClick={deleteMessageForEveryone}
            loading={loading}
          >
            Confirm delete for everyone
          </Button>
        </Space>
      );
    }

    return (
      <Space wrap size={10}>
        <Button
          className="delete-modal-cancel-btn"
          onClick={closeModal}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          className="delete-modal-confirm-btn"
          onClick={deleteMessageForMe}
          loading={loading}
        >
          Delete for me
        </Button>
      </Space>
    );
  };

  const deletionModal = (
    <Modal
      title={everyoneConfirm ? "Delete for everyone?" : "Delete message?"}
      open={visible}
      onCancel={closeModal}
      footer={renderFooter()}
      centered
      width="min(440px, 92vw)"
      destroyOnHidden
      maskClosable={!loading}
      className="delete-message-modal"
      styles={{
        content: {
          background: "var(--modal-bg)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-strong)",
          borderRadius: "16px",
          padding: "20px 24px",
          boxShadow: "var(--glass-shadow)",
        },
        header: {
          background: "transparent",
          marginBottom: "8px",
        },
        body: {
          background: "transparent",
          color: "var(--text-secondary)",
          padding: "0",
        },
        footer: {
          background: "transparent",
          marginTop: "20px",
        },
      }as any}
    >
      <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
        {everyoneConfirm
          ? "This message will be permanently deleted for all participants in this chat."
          : isMyMessage
          ? "Choose how you want to delete this message."
          : "Are you sure you want to delete this message for yourself?"}
      </p>
    </Modal>
  );

  return {
    handleDeleteMessage,
    deletionModal,
  };
};