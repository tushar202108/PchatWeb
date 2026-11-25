
import { Button, Input, Progress, Tooltip } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

import AttachmentPicker from "./AttachmentPicker";

interface Props {
  draft: string;
  attachments: File[];
  attachmentProgress?: number[];
  uploading?: boolean;
  showEmojiPicker: boolean;
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

        <Input
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
