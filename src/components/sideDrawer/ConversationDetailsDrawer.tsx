
import {
  Avatar,
  Button,
  Drawer,
} from "antd";
import {
  CloseOutlined,
  TeamOutlined,
  UserOutlined,

} from "@ant-design/icons";

import type {
  ChatMessage,
  Conversation,
} from "../../types/chats.type";

import ConversationWallpaperPicker from "../chat/ConversationWallpaperPicker";
import "./sideDrawer.css";
import SharedConversationContent from "../ConversationContent/ConversationContent"



interface Props {
  selected: Conversation | null;
  onlineUsers: string[];
  open: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onWallpaperChange: (url: string) => void;
}


export default function ConversationDetailsDrawer({
  selected,
  onlineUsers,
  open,
  messages,
  onClose,
  onWallpaperChange,
}: Props) {
  if (!selected) return null;

  const username = String(selected.username ?? "")
    .trim()
    .toLowerCase();

  const isOnline = onlineUsers.some(
    (user) => String(user).trim().toLowerCase() === username
  );

  const isGroup = selected.id.startsWith("group-");

  return (
    <Drawer
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
      closable={false}
      destroyOnHidden
      className="conversation-details-drawer"
      title={
        <div className="conversation-details-title">
          <span>Contact details</span>

          <Button
            type="text"
            aria-label="Close contact details"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="conversation-details-close"
          />
        </div>
      }
    >
      <div className="conversation-details">
        <div className="conversation-details-profile">
          <Avatar
            size={80}
            icon={isGroup ? <TeamOutlined /> : <UserOutlined />}
          />

          <h3>{selected.name}</h3>

          <span
            className={
              isOnline
                ? "conversation-online"
                : "conversation-offline"
            }
          >
            <span className="conversation-status-dot" />
            {isOnline ? "Online" : "Offline"}
          </span>

          {selected.username && <p>{selected.username}</p>}
        </div>

        <ConversationWallpaperPicker
          conversationId={selected.id}
          onWallpaperChange={onWallpaperChange}
        />

        {/* Conversation-wise shared content */}
        <SharedConversationContent
          key={selected.id}
          messages={messages}
        />
      </div>
    </Drawer>
  );
}
