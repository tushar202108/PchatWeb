
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
import "../index.css";

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

interface SelectGroupMembersProps {
  conversations: GroupConversation[];
  selectedMembers: string[];
  onChange: (members: string[]) => void;
}

// Select group members component
function SelectGroupMembers({
  conversations,
  selectedMembers,
  onChange,
}: SelectGroupMembersProps) {
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((conversation) =>
    conversation.name
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(
      selectedMembers.includes(id)
        ? selectedMembers.filter((member) => member !== id)
        : [...selectedMembers, id]
    );
  };

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
            .filter((conversation) =>
              selectedMembers.includes(conversation.id)
            )
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
          <Text className="group-members-empty">
            No contacts found
          </Text>
        ) : (
          filtered.map((conversation) => {
            const checked = selectedMembers.includes(conversation.id);

            return (
              <div
                key={conversation.id}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                className={`group-member-row ${checked ? "selected" : ""
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
    </div>
  );
}

export default function CreateGroupModal({
  open,
  conversations,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const resetForm = () => {
    setGroupName("");
    setGroupMembers([]);
  };

  const handleCreate = () => {
    if (!groupName.trim() || groupMembers.length < 2) return;

    onCreate(groupName.trim(), groupMembers);

    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      rootClassName="create-group-modal new-chat-modal"
      title={
        <span style={{ color: "#ffffff", fontWeight: 600 }}>
          Create Group
        </span>
      }
      open={open}
      centered
      destroyOnClose
      width={460}
      className="stylish-gradient-modal"
      onCancel={handleClose}
      onOk={handleCreate}
      okText={`Create Group`}
      okButtonProps={{
        disabled: !groupName.trim() || groupMembers.length < 2,
      }}
      cancelButtonProps={{
        style: {
          background: "tarnsparent",
          borderColor: "rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
        },
      }}
     
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

        <SelectGroupMembers
          conversations={conversations}
          selectedMembers={groupMembers}
          onChange={setGroupMembers}
        />

        {groupMembers.length < 2 && (
          <Text className="group-hint">
            Select at least 2 members to create a group.
          </Text>
        )}
        {groupName.length <3 &&(
          <Text className="group-hint">
            Group name must be greater than 3 character's
          </Text>
        )}
      </div>
    </Modal>
  );
}
