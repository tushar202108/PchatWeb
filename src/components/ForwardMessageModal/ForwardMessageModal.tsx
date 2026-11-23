
import { useEffect, useState } from "react";
import {
  TeamOutlined,
  UserOutlined,
  ForwardOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import type {
  ChatMessage,
  Conversation,
} from "../../types/chats.type";

import "./ForwardModal.css";

interface Props {
  open: boolean;
  messages: ChatMessage[];
  conversations: Conversation[];
  onCancel: () => void;
  onForward: (
    messages: ChatMessage[],
    conversation: Conversation
  ) => Promise<void>;
}

export default function ForwardMessageModal({
  open,
  messages,
  conversations,
  onCancel,
  onForward,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setSelectedConversationId(null);
    }
  }, [open]);

  if (!open) return null;

  const availableConversations = conversations.filter(
    (conversation) => !conversation.archived
  );

  const handleForward = async (conversation: Conversation) => {
    if (loading) return;

    try {
      setLoading(true);
      setSelectedConversationId(String(conversation.id));

      await onForward(messages, conversation);
    } catch (error) {
      console.error("Forward failed:", error);
    } finally {
      setLoading(false);
      setSelectedConversationId(null);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onCancel();
  };

  return (
    <div
      className="forward-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="forward-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-modal-heading"
      >
        {/* Header */}
        <div className="forward-modal-header">
          <div className="forward-modal-heading">
            <ForwardOutlined className="forward-modal-icon" />

            <h3 id="forward-modal-heading">
              Forward message
            </h3>
          </div>

          <button
            type="button"
            className="forward-modal-close"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Content */}
        <div className="forward-modal-content">
          <div className="forward-selected-count">
            {messages.length} message(s) selected
          </div>

          {availableConversations.length === 0 ? (
            <div className="forward-empty">
              No conversations available
            </div>
          ) : (
            <div className="forward-conversation-list">
              {availableConversations.map((conversation) => {
                const conversationId = String(conversation.id);
                const isSelected =
                  selectedConversationId === conversationId;

                const isGroup = conversationId.startsWith("group-");

                return (
                  <button
                    type="button"
                    key={conversationId}
                    className={`forward-conversation-item ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleForward(conversation)}
                    disabled={loading}
                  >
                    <div className="forward-avatar">
                      {isGroup ? (
                        <TeamOutlined />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>

                    <div className="forward-conversation-details">
                      <div className="forward-conversation-name">
                        {conversation.name}
                      </div>

                      <div className="forward-conversation-preview">
                        {conversation.lastMessage || "No messages yet"}
                      </div>
                    </div>

                    {isSelected && loading && (
                      <div className="forward-loading">
                        <span className="forward-spinner" />
                        <span>Forwarding</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
