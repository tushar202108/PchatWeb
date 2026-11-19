
import { Button, Input } from "antd";
import {
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";

import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

import AttachmentPicker from "./AttachmentPicker";

interface Props {
  draft: string;
  attachments: File[];
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
    <div
      className="message-composer"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
      }}
    >
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
      />

      <Input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onPressEnter={(event) => {
          if (!event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
      />

      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={onSend}
        style={{
          backgroundColor: "#0d9489c7",
          borderColor: "#0d9489c7",
        }}
      >
        {sendLabel}
      </Button>
    </div>
  );
}
