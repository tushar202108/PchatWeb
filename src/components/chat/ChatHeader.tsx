
import { Avatar, Button } from "antd";
import {
  ArrowLeftOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { Conversation } from "../../types/chats.type";
import "./chatHeader.css"
interface Props {
  selected: Conversation;
  onlineUsers: string[];
  onBack: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeader({
  selected,
  onlineUsers,
  onBack,
  onOpenDetails,
}: Props) {
  const isOnline = onlineUsers.includes(
    String(selected.username ?? "").trim().toLowerCase()
  );

  const isGroup = selected.id.startsWith("group-");

  return (
    <div className="chat-header">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        className="mobile-back-btn"
        onClick={onBack}
      />

      <button
        type="button"
        className="chat-header-details"
        onClick={onOpenDetails}
        aria-label="Open chat details"
      >
        <Avatar
          icon={isGroup ? <TeamOutlined /> : <UserOutlined />}
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
      </button>
    </div>
  );
}
