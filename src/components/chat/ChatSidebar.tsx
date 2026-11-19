
import {
  Avatar,
  Button,
  Input,
  List,
  Space,
  Typography,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

import ProfileMenu from "../profile/ProfileMenu";
import ConversationItem from "./ConversationItem";

import type {
  Conversation,
  SidebarTab,
} from "../../types/chats.type";

import type {
  ProfileMenuAction,
  ProfileStatus,
} from "../ProfileMenu";

import { EMPTY_TEXT, SIDEBAR_TABS } from "../../types/chats.type";

const { Text } = Typography;

interface Props {
  user: any;
  connected: boolean;
  profileStatus: ProfileStatus;
  conversations: Conversation[];
  selected: Conversation | null;
  onlineUsers: string[];
  sidebarQuery: string;
  sidebarTab: SidebarTab;
  unreadTotal: number;

  onStatusChange: (status: ProfileStatus) => void;
  onProfileAction: (action: ProfileMenuAction) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: SidebarTab) => void;
  onSelect: (item: Conversation) => void;
  onDelete: (item: Conversation) => void;
  onArchive: (id: string) => void;
  onNewChat: () => void;
  onCreateGroup: () => void;
}

export default function ChatSidebar({
  user,
  connected,
  profileStatus,
  conversations,
  selected,
  onlineUsers,
  sidebarQuery,
  sidebarTab,
  unreadTotal,
  onStatusChange,
  onProfileAction,
  onSearchChange,
  onTabChange,
  onSelect,
  onDelete,
  onArchive,
  onNewChat,
  onCreateGroup,
}: Props) {
  return (
    <div className="chat-sidebar-inner">
      <div
        className="sidebar-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <ProfileMenu
          name={user?.name || user?.email || ""}
          email={user?.email}
          status={profileStatus}
          onStatusChange={onStatusChange}
          onAction={onProfileAction}
        >
          <div
            style={{
              position: "relative",
              display: "inline-block",
              cursor: "pointer",
            }}
          >
            <Avatar
              src={user?.profileImage}
              icon={<UserOutlined />}
            />

            <span
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                height: "9px",
                width: "9px",
                borderRadius: "50%",
                backgroundColor: connected ? "#10B981" : "#9CA3AF",
                border: "2px solid #ffffff",
              }}
            />
          </div>
        </ProfileMenu>

        <div className="sidebar-user">
          <Text strong>{user?.name || user?.email}</Text>
        </div>

        <Space size={4} className="sidebar-header-actions">
          <Button
            type="text"
            icon={<PlusOutlined />}
            title="New Chat"
            onClick={onNewChat}
          />

          <Button
            type="text"
            icon={<EditOutlined />}
            title="Create Group"
            onClick={onCreateGroup}
          />
        </Space>
      </div>

      <div className="sidebar-filters">
        <Input
          className="sidebar-search"
          prefix={<SearchOutlined />}
          placeholder="Search conversations"
          value={sidebarQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          allowClear
        />

        <div className="sidebar-tabs" role="tablist">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={sidebarTab === tab.key}
              className={`sidebar-tab ${
                sidebarTab === tab.key ? "active" : ""
              }`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}

              {tab.key === "unread" && unreadTotal > 0 && (
                <span className="sidebar-tab-count">
                  {unreadTotal}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <List
        dataSource={conversations}
        locale={{
          emptyText: sidebarQuery.trim()
            ? "No matching conversations"
            : EMPTY_TEXT[sidebarTab],
        }}
        renderItem={(item) => (
          <ConversationItem
            key={item.id}
            item={item}
            selected={selected?.id === item.id}
            onSelect={onSelect}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        )}
      />
    </div>
  );
}
