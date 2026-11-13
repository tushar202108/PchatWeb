
import { useState } from "react";
import {
  Avatar,
  Input,
  Modal,
  Tag,
  Typography,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  TeamOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import "../index.css"
const { Text } = Typography;

export interface GroupConversation {
  id: string;
  name: string;
}

interface CreateGroupModalProps {
  open: boolean;
  conversations: GroupConversation[];
  onClose: () => void;
  onCreate: (name: string, members: string[]) => void;
}

export default function CreateGroupModal({
  open,
  conversations,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const toggle = (id: string) => {
    setGroupMembers((current) =>
      current.includes(id)
        ? current.filter((member) => member !== id)
        : [...current, id]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || groupMembers.length < 2) return;

    onCreate(groupName.trim(), groupMembers);

    setGroupName("");
    setGroupMembers([]);
    setQuery("");
  };

  const handleClose = () => {
    setGroupName("");
    setGroupMembers([]);
    setQuery("");
    onClose();
  };

  return (
   <Modal
      title={<span style={{ color: "#000000", fontWeight: 600}}>Create Group</span>}
      open={open}
      centered
      destroyOnClose
      width={460}
      className="stylish-gradient-modal" // <-- Add this class
      onCancel={handleClose}
      onOk={handleCreate}
      okText={`Create Group (${groupMembers.length})`}
      okButtonProps={{
        disabled: !groupName.trim() || groupMembers.length < 2,
      }}
      cancelButtonProps={{
        style: {
          background: "transparent",
          borderColor: "rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
        },
      }}
      styles={{
        content: {
          background: "linear-gradient(135deg, #1e1e2f 0%, #2a2a40 100%)",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        header: { background: "transparent" },
        body: { background: "transparent", color: "rgba(255, 255, 255, 0.85)" },
        footer: { background: "transparent" },
      }as any}
    >
      <div className="group-field">
        <Text className="group-label">Group name</Text>

        <Input
          prefix={<TeamOutlined />}
          placeholder="Enter group name"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          maxLength={50}
          size="large"
        />
      </div>

      <div className="group-field">
        <div className="group-label-row">
          <Text className="group-label">Add members</Text>
          <Text className="group-count">
            {groupMembers.length} selected
          </Text>
        </div>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Search contacts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />

        {groupMembers.length > 0 && (
          <div className="group-members-chips">
            {conversations
              .filter((item) => groupMembers.includes(item.id))
              .map((item) => (
                <Tag
                  key={item.id}
                  closable
                  onClose={() => toggle(item.id)}
                  className="group-member-chip"
                >
                  {item.name}
                </Tag>
              ))}
          </div>
        )}

        <div className="group-members-list">
          {filtered.length === 0 ? (
            <Text className="group-members-empty">
              No contacts found
            </Text>
          ) : (
            filtered.map((conversation) => {
              const checked = groupMembers.includes(conversation.id);

              return (
                <div
                  key={conversation.id}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  className={`group-member-row ${
                    checked ? "selected" : ""
                  }`}
                  onClick={() => toggle(conversation.id)}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      toggle(conversation.id);
                    }
                  }}
                >
                  <Avatar size={32} icon={<UserOutlined />} />
                  <span className="group-member-name">
                    {conversation.name}
                  </span>
                  {checked && (
                    <CheckOutlined className="group-member-check" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {groupMembers.length < 2 && (
          <Text className="group-hint">
            Select at least 2 members to create a group.
          </Text>
        )}
      </div>
    </Modal>
  );
}
