
import {
  CheckOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Input,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

import type { SelectGroupMembersProps } from "../../types/myGroup.types";
import "../../index.css";

const { Text } = Typography;

export function SelectGroupMembers({
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
    </div>
  );
}
