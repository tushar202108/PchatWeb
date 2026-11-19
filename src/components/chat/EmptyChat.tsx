
import { Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export default function EmptyChat() {
  return (
    <div className="empty-chat">
      <div className="empty-chat-icon-wrapper">
        <MessageOutlined className="empty-chat-emoji" />
      </div>

      <Title level={4}>Start Private Chats</Title>

      <Text type="secondary">
        Select a conversation to start messaging securely.
      </Text>
    </div>
  );
}
