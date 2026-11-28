
import { Button, Input, Progress, Tooltip } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  LoadingOutlined,
  CloseOutlined,
  MessageOutlined,
} from "@ant-design/icons";

import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

import type { ChatMessage } from "../../types/chats.type";

import AttachmentPicker from "./AttachmentPicker";
import "./AttachmentPicker.css";

interface Props {
  draft: string;
  attachments: File[];
  attachmentProgress?: number[];
  uploading?: boolean;
  showEmojiPicker: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  onDraftChange: (value: string) => void;
  onAttachmentsChange: (files: File[]) => void;
  onEmojiClick: (emoji: EmojiClickData) => void;
  onToggleEmoji: () => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;
}

export default function MessageComposer({
  draft,
  attachments,
  attachmentProgress = [],
  uploading = false,
  showEmojiPicker,
  replyingTo,
  onCancelReply,
  onDraftChange,
  onAttachmentsChange,
  onEmojiClick,
  onToggleEmoji,
  onSend,
  placeholder,
  sendLabel,
}: Props) {
  
  return (
    <div style={{ position: "relative" }}>
      {showEmojiPicker && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            zIndex: 1000,
          }}
        >
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* REPLY PREVIEW */}
      {replyingTo && (
        <div className="composer-reply-preview">
          <div className="composer-reply-indicator" />

          <div className="composer-reply-content">
            <div className="composer-reply-header">
              <MessageOutlined />
              <span>
                {replyingTo.mine ? "You" : "Replying to message"}
              </span>
            </div>

            <div className="composer-reply-text">
              {replyingTo.text ||
                (replyingTo.attachments?.length
                  ? `📎 ${replyingTo.attachments.length} attachment(s)`
                  : "Message")}
            </div>
          </div>

          <Button
            type="text"
            className="composer-reply-close"
            icon={<CloseOutlined />}
            onClick={onCancelReply}
            title="Cancel reply"
          />
        </div>
      )}

      {uploading && attachments.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: 8,
            borderRadius: 8,
            background: "var(--card-bg, #0A1713)",
          }}
        >
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "var(--text-primary, #fff)",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </div>

                <Progress
                  percent={attachmentProgress[index] ?? 0}
                  size="small"
                  status="active"
                />
              </div>

              <span
                style={{
                  color: "var(--text-muted, #aaa)",
                  fontSize: 11,
                }}
              >
                {attachmentProgress[index] ?? 0}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        className="message-composer"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <AttachmentPicker
          files={attachments}
          onChange={onAttachmentsChange}
        />

        <Button
          type="text"
          icon={<SmileOutlined />}
          title="Choose emoji"
          style={{ color: "#fff" }}
          onClick={onToggleEmoji}
          disabled={uploading}
        />

        <Input.TextArea
          className="chat-message-input"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey && !uploading) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={uploading}
          autoSize={{ minRows: 1, maxRows: 5 }}
        />

        <Tooltip title={uploading ? "Uploading attachments..." : sendLabel}>
          <Button
            type="primary"
            icon={uploading ? <LoadingOutlined /> : <SendOutlined />}
            onClick={onSend}
            loading={uploading}
            disabled={uploading}
            style={{
              backgroundColor: "#0d9489c7",
              borderColor: "#0d9489c7",
            }}
          >
            {sendLabel}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
