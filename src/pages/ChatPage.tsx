import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Avatar,
  Button,
  Input,
  Layout,
  List,
  Typography,
  Space,
  Modal,
  Tag,
} from "antd";
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  PaperClipOutlined,
  SmileOutlined,
  CloseOutlined,
  TeamOutlined,
  SearchOutlined,
  CheckOutlined,
  ContainerOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { useAuth } from "../context/authContext";
import sys from "../constant/navigation.json";
import NewChatModal from "../components/NewChatModal";
import type { NewChatContact } from "../components/NewChatModal";

import ProfileMenu from "../components/ProfileMenu";
import type {
  ProfileMenuAction,
  ProfileStatus,
} from "../components/ProfileMenu";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../context/WebSocketContext";

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread?: number;
  archived?: boolean;
}

interface ChatMessage {
  id: string | number;
  text: string;
  mine: boolean;
  senderName?: string;
  attachments?: File[];
}

type SidebarTab = "all" | "unread" | "archived";

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: "all", label: "All messages" },
  { key: "unread", label: "Unread" },
  { key: "archived", label: "Archived" },
];

const EMPTY_TEXT: Record<SidebarTab, string> = {
  all: "No conversations yet",
  unread: "No unread messages",
  archived: "No archived conversations",
};

const MIN_GROUP_MEMBERS = 2;

const staticConversations: Conversation[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    lastMessage: "Hey, how are you?",
  },
  {
    id: "2",
    name: "Priya Verma",
    lastMessage: "Let's catch up tomorrow.",
    unread: 2,
  },
  {
    id: "3",
    name: "Amit Kumar",
    lastMessage: "Project update sent.",
    unread: 1,
  },
  {
    id: "4",
    name: "Neha Singh",
    lastMessage: "Thanks for your help!",
  },
  {
    id: "5",
    name: "Ankit Gupta",
    lastMessage: "See you soon.",
  },
];

const staticMessages: Record<string, ChatMessage[]> = {
  "1": [
    { id: 1, text: "Hi Rahul!", mine: true },
    { id: 2, text: "Hey, how are you?", mine: false },
    { id: 3, text: "I'm good. How about you?", mine: true },
    { id: 4, text: "Doing great, thanks!", mine: false },
  ],
  "2": [
    { id: 1, text: "Are you free tomorrow?", mine: true },
    { id: 2, text: "Let's catch up tomorrow.", mine: false },
  ],
  "3": [
    { id: 1, text: "How is the project going?", mine: false },
    { id: 2, text: "Project update sent.", mine: false },
  ],
  "4": [
    { id: 1, text: "Can you help me with this?", mine: false },
    { id: 2, text: "Thanks for your help!", mine: true },
  ],
  "5": [
    { id: 1, text: "Are we meeting today?", mine: true },
    { id: 2, text: "See you soon.", mine: false },
  ],
};

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const { connected, publish } = useWebSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] =
    useState<Conversation[]>(staticConversations);

  const [selected, setSelected] = useState<Conversation | null>(null);

  const [draft, setDraft] = useState("");

  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>(staticMessages);

  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [attachments, setAttachments] = useState<File[]>([]);

  const [createGroupVisible, setCreateGroupVisible] = useState(false);

  const [newChatVisible, setNewChatVisible] = useState(false);

  const [groupName, setGroupName] = useState("");

  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const [sidebarQuery, setSidebarQuery] = useState("");

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileStatus, setProfileStatus] =
    useState<ProfileStatus>("available");

  const messages = selected ? (messagesByConversation[selected.id] ?? []) : [];

  const visibleConversations = conversations.filter((conversation) => {
    const query = sidebarQuery.trim().toLowerCase();

    if (query && !conversation.name.toLowerCase().includes(query)) {
      return false;
    }

    if (sidebarTab === "archived") {
      return Boolean(conversation.archived);
    }

    if (conversation.archived) {
      return false;
    }

    if (sidebarTab === "unread") {
      return (conversation.unread ?? 0) > 0;
    }

    return true;
  });

  const unreadTotal = conversations.filter(
    (conversation) => !conversation.archived && (conversation.unread ?? 0) > 0,
  ).length;

  const toggleArchive = (id: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, archived: !conversation.archived }
          : conversation,
      ),
    );
  };

  const sendMessage = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = draft.trim();

    if ((!text && attachments.length === 0) || !selected) {
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now(),
      text,
      mine: true,
      attachments: [...attachments],
    };

    // Publish through WebSocket service
    const payload = {
      // chatRoomId: selected.id,
      // senderId: user?.email || "current_user",
      // senderName: user?.name || "Pranshu",
      // content: text,
      // timestamp: new Date().toISOString(),

      messageId: null,
      senderId: user?.id,
      receiverId: "",
      content: text,
      messageType: "",
      timestamp: new Date().toISOString(),
    };

    publish("/app/chat", payload);

    setMessagesByConversation((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] ?? []), newMessage],
    }));

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selected.id
          ? {
            ...conversation,
            lastMessage: text || `📎 ${attachments.length} attachment(s)`,
          }
          : conversation,
      ),
    );

    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleSelectConversation = (item: Conversation) => {
    setSelected(item);
    setDraft("");
    setAttachments([]);
    setShowEmojiPicker(false);
    setMobileView("chat");

    if ((item.unread ?? 0) > 0) {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === item.id
            ? { ...conversation, unread: 0 }
            : conversation,
        ),
      );
    }
  };

  const handleNewChatSelect = (contact: NewChatContact) => {
    const existing = conversations.find(
      (conversation) => conversation.id === contact.id,
    );

    if (existing) {
      if (existing.archived) {
        toggleArchive(existing.id);
      }
      handleSelectConversation(existing);
    }

    setNewChatVisible(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setDraft((current) => current + emojiData.emoji);
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    setAttachments((current) => [...current, ...files]);

    event.target.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleCreateGroup = () => {
    const name = groupName.trim();

    if (!name || groupMembers.length < MIN_GROUP_MEMBERS) {
      return;
    }

    const groupId = `group-${Date.now()}`;

    const newGroup: Conversation = {
      id: groupId,
      name,
      lastMessage: "Group created",
    };

    setConversations((current) => [newGroup, ...current]);

    setMessagesByConversation((current) => ({
      ...current,
      [groupId]: [],
    }));

    setSelected(newGroup);
    setMobileView("chat");

    setSidebarTab("all");
    setSidebarQuery("");

    setGroupName("");
    setGroupMembers([]);
    setCreateGroupVisible(false);
  };

  const handleProfileAction = async (action: ProfileMenuAction) => {
    switch (action) {
      case "profile":
      case "settings":
      case "privacy":
        break;
      case "logout":
        try {
          await signOut();
          navigate("/signin", { replace: true });
        } catch (error) {
          console.error("Failed to sign out cleanly:", error);
          navigate("/signin", { replace: true });
        }
        break;
    }
  };

  return (
    <Layout
      className={`chat-layout ${mobileView === "chat" ? "show-chat" : "show-sidebar"
        }`}
    >
      <Sider
        width={340}
        className="chat-sidebar"
        breakpoint="md"
        collapsedWidth={0}
      >
        <div className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ProfileMenu
            name={user?.name || user?.email || ""}
            email={user?.email}
            status={profileStatus}
            onStatusChange={setProfileStatus}
            onAction={handleProfileAction}
          >
            <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
              <Avatar src={user?.profileImage} icon={<UserOutlined />} />
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
              onClick={() => setNewChatVisible(true)}
            />

            <Button
              type="text"
              icon={<EditOutlined />}
              title="Create Group"
              onClick={() => setCreateGroupVisible(true)}
            />
          </Space>
        </div>

        <div className="sidebar-filters">
          <Input
            className="sidebar-search"
            prefix={<SearchOutlined />}
            placeholder="Search conversations"
            value={sidebarQuery}
            onChange={(event) => setSidebarQuery(event.target.value)}
            allowClear
          />

          <div className="sidebar-tabs" role="tablist">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={sidebarTab === tab.key}
                className={`sidebar-tab ${sidebarTab === tab.key ? "active" : ""
                  }`}
                onClick={() => setSidebarTab(tab.key)}
              >
                {tab.label}
                {tab.key === "unread" && unreadTotal > 0 && (
                  <span className="sidebar-tab-count">{unreadTotal}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <List
          dataSource={visibleConversations}
          locale={{
            emptyText: sidebarQuery.trim()
              ? "No matching conversations"
              : EMPTY_TEXT[sidebarTab],
          }}
          renderItem={(item) => (
            <List.Item
              className={`conversation-item ${selected?.id === item.id ? "selected" : ""
                }`}
              onClick={() => handleSelectConversation(item)}
              actions={[
                <div key="meta" className="conversation-side">
                  {(item.unread ?? 0) > 0 && (
                    <span className="conversation-unread">{item.unread}</span>
                  )}
                  <Button
                    type="text"
                    size="small"
                    className="conversation-archive-btn"
                    icon={
                      item.archived ? (
                        <RollbackOutlined />
                      ) : (
                        <ContainerOutlined />
                      )
                    }
                    title={item.archived ? "Unarchive" : "Archive"}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleArchive(item.id);
                    }}
                  />
                </div>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.id.startsWith("group-") ? (
                        <TeamOutlined />
                      ) : (
                        <UserOutlined />
                      )
                    }
                  />
                }
                title={item.name}
                description={item.lastMessage}
              />
            </List.Item>
          )}
        />
      </Sider>

      <Content className="chat-content">
        {selected ? (
          <>
            <div className="chat-header">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                className="mobile-back-btn"
                onClick={() => setMobileView("sidebar")}
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

              <Title level={5} style={{ margin: 0 }}>
                {selected.name}
              </Title>
            </div>

            <div className="message-list">
              {messages.length === 0 ? (
                <Text type="secondary">{sys.sys.chat.noMessages}</Text>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble ${message.mine ? "mine" : "theirs"
                      }`}
                  >
                    {!message.mine && message.senderName && (
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: "bold",
                          opacity: 0.8,
                        }}
                      >
                        {message.senderName}
                      </div>
                    )}
                    {message.text && <div>{message.text}</div>}

                    {message.attachments?.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        style={{ marginTop: 6 }}
                      >
                        <PaperClipOutlined />{" "}
                        <a
                          href={URL.createObjectURL(file)}
                          download={file.name}
                          style={{
                            color: "inherit",
                            textDecoration: "underline",
                          }}
                        >
                          {file.name}
                        </a>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="message-composer" style={{ position: "relative" }}>
              {showEmojiPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    zIndex: 1000,
                  }}
                >
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}

              {attachments.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    right: 0,
                    padding: 8,
                    zIndex: 999,
                    background: "#fff",
                  }}
                >
                  {attachments.map((file, index) => (
                    <Space
                      key={`${file.name}-${index}`}
                      size={4}
                      style={{ marginRight: 8 }}
                    >
                      <PaperClipOutlined />
                      <Text>{file.name}</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        title={`Remove ${file.name}`}
                        onClick={() => removeAttachment(index)}
                      />
                    </Space>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handleAttachmentChange}
              />

              <Button
                type="text"
                icon={<PaperClipOutlined />}
                title="Attach files"
                style={{ color: "#fff" }}
                onClick={() => fileInputRef.current?.click()}
              />

              <Button
                type="text"
                icon={<SmileOutlined />}
                title="Choose emoji"
                style={{ color: "#fff" }}
                onClick={() => setShowEmojiPicker((current) => !current)}
              />

              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onPressEnter={(event) => {
                  if (!event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={sys.sys.chat.messagePlaceholder}
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage()}
                style={{
                  backgroundColor: "green",
                  borderColor: "green",
                }}
              >
                {sys.sys.chat.send}
              </Button>
            </div>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-chat-icon-wrapper">
              <MessageOutlined className="empty-chat-emoji" />
            </div>

            <Title level={4}>Start Private Chats</Title>

            <Text type="secondary">
              Select a conversation to start messaging securely.
            </Text>
          </div>
        )}
      </Content>

      <NewChatModal
        open={newChatVisible}
        contacts={conversations
          .filter((conversation) => !conversation.id.startsWith("group-"))
          .map<NewChatContact>((conversation) => ({
            id: conversation.id,
            name: conversation.name,
            subtitle: conversation.lastMessage,
          }))}
        onClose={() => setNewChatVisible(false)}
        onSelect={handleNewChatSelect}
      />

      <Modal
        rootClassName="create-group-modal"
        title="Create Group"
        open={createGroupVisible}
        centered
        destroyOnHidden
        width={460}
        onCancel={() => {
          setCreateGroupVisible(false);
          setGroupName("");
          setGroupMembers([]);
        }}
        onOk={handleCreateGroup}
        okText={
          groupMembers.length > 0
            ? `Create Group (${groupMembers.length})`
            : "Create Group"
        }
        okButtonProps={{
          disabled:
            !groupName.trim() || groupMembers.length < MIN_GROUP_MEMBERS,
        }}
      >
        <div className="group-field">
          <Text className="group-label">Group name</Text>
          <Input
            prefix={<TeamOutlined />}
            placeholder="Enter group name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            onPressEnter={handleCreateGroup}
            maxLength={50}
            size="large"
          />
        </div>

        <div className="group-field">
          <div className="group-label-row">
            <Text className="group-label">Add members</Text>
            <Text className="group-count">{groupMembers.length} selected</Text>
          </div>
          <SelectGroupMembers
            conversations={conversations.filter(
              (conversation) => !conversation.id.startsWith("group-"),
            )}
            selectedMembers={groupMembers}
            onChange={setGroupMembers}
          />
          {groupMembers.length < MIN_GROUP_MEMBERS && (
            <Text className="group-hint">
              Select at least {MIN_GROUP_MEMBERS} members to create a group.
            </Text>
          )}
        </div>
      </Modal>
    </Layout>
  );
}

function SelectGroupMembers({
  conversations,
  selectedMembers,
  onChange,
}: {
  conversations: Conversation[];
  selectedMembers: string[];
  onChange: (members: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggle = (id: string) =>
    onChange(
      selectedMembers.includes(id)
        ? selectedMembers.filter((member) => member !== id)
        : [...selectedMembers, id],
    );

  return (
    <div className="group-members">
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search contacts"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        allowClear
      />

      {selectedMembers.length > 0 && (
        <div className="group-members-chips">
          {conversations
            .filter((conversation) => selectedMembers.includes(conversation.id))
            .map((conversation) => (
              <Tag
                key={conversation.id}
                closable
                onClose={() => toggle(conversation.id)}
                className="group-member-chip"
              >
                {conversation.name}
              </Tag>
            ))}
        </div>
      )}

      <div className="group-members-list">
        {filtered.length === 0 ? (
          <Text className="group-members-empty">No contacts found</Text>
        ) : (
          filtered.map((conversation) => {
            const checked = selectedMembers.includes(conversation.id);

            return (
              <div
                key={conversation.id}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                className={`group-member-row ${checked ? "selected" : ""}`}
                onClick={() => toggle(conversation.id)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    toggle(conversation.id);
                  }
                }}
              >
                <Avatar size={32} icon={<UserOutlined />} />
                <span className="group-member-name">{conversation.name}</span>
                {checked && <CheckOutlined className="group-member-check" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
