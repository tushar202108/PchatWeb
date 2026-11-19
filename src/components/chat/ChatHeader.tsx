
import { Avatar, Button } from "antd";
import {
  ArrowLeftOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { Conversation } from "../../types/chats.type";

interface Props {
  selected: Conversation;
  onlineUsers: string[];
  onBack: () => void;
}

export default function ChatHeader({
  selected,
  onlineUsers,
  onBack,
}: Props) {
  const isOnline = onlineUsers.includes(
    String(selected.username ?? "").trim().toLowerCase()
  );

  return (
    <div className="chat-header">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        className="mobile-back-btn"
        onClick={onBack}
      />

      <Avatar
        icon={
          selected.id.startsWith("group-") ? (
            <TeamOutlined />
          ) : (
            <UserOutlined />
          )
        }
      />

      <div className="user-status-container">
        <div className="user-info">
          <span className="selected-user-name">
            {selected.name}
          </span>

          <span className={isOnline ? "online-status" : "offline-status"}>
            <span
              className={`status-dot ${
                isOnline ? "online-dot" : "offline-dot"
              }`}
            />
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
