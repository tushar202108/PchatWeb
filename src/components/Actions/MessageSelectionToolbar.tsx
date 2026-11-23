
import { Button, Space, Typography, Tooltip } from "antd";
import {
  ForwardOutlined,
  CopyOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import type { ChatMessage } from "../../types/chats.type";
import "./MessageSelectionToolbar.css"
const { Text } = Typography;

interface Props {
  selectedMessages: ChatMessage[];
  onForward: (messages: ChatMessage[]) => void;
  onCopy: (messages: ChatMessage[]) => void;
  onDelete: (messages: ChatMessage[]) => void;
  onCancel: () => void;
}

export default function MessageSelectionToolbar({
  selectedMessages,
  onForward,
  onCopy,
  onDelete,
  onCancel,
}: Props) {
  if (selectedMessages.length === 0) return null;

  return (
    <div className="message-selection-toolbar">
      {/* TOP: Cancel and selected count */}
      <div className="message-selection-toolbar-top">
        <Space align="center">
          <Tooltip title="Cancel selection">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onCancel}
            />
          </Tooltip>

          <Text strong>{selectedMessages.length} selected</Text>
        </Space>
      </div>

      {/* BOTTOM: All three actions */}
      <div className="message-selection-toolbar-bottom">
        <Button
          type="text"
          icon={<ForwardOutlined />}
          onClick={() => onForward(selectedMessages)}
        >
          Forward
        </Button>

        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={() => onCopy(selectedMessages)}
        >
          Copy
        </Button>

        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(selectedMessages)}
        >
          Delete ({selectedMessages.length})
        </Button>
      </div>
    </div>
  );
}
