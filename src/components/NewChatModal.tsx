import { useMemo, useState } from "react";
import { Input, Modal, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface NewChatContact {
  id: string;
  name: string;
  subtitle?: string;
  online?: boolean;
}

interface NewChatModalProps {
  open: boolean;
  contacts: NewChatContact[];
  onClose: () => void;
  onSelect: (contact: NewChatContact) => void;
}

const AVATAR_TONES = [
  "#d4b896",
  "#8fa090",
  "#c49a96",
  "#96a3b3",
  "#a89aae",
  "#bfa26e",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export default function NewChatModal({
  open,
  contacts,
  onClose,
  onSelect,
}: NewChatModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handlePick = (contact: NewChatContact) => {
    setQuery("");
    onSelect(contact);
  };

  return (
    <Modal
      rootClassName="create-group-modal new-chat-modal"
      title="New Chat"
      open={open}
      centered
      footer={null}
      destroyOnHidden
      width={440}
      onCancel={handleClose}
    >
      <Input
        className="new-chat-search"
        prefix={<SearchOutlined />}
        placeholder="Search contacts"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onPressEnter={() => {
          if (filtered.length === 1) handlePick(filtered[0]);
        }}
        allowClear
        autoFocus
        size="large"
      />

      <div className="new-chat-section-label">
        {query.trim() ? "Results" : "All contacts"}
      </div>

      <div className="new-chat-list">
        {filtered.length === 0 ? (
          <Text className="group-members-empty">No contacts found</Text>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              role="button"
              tabIndex={0}
              className="new-chat-row"
              onClick={() => handlePick(contact)}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  handlePick(contact);
                }
              }}
            >
              <span
                className="new-chat-avatar"
                style={{ background: toneFor(contact.id) }}
              >
                {initialsOf(contact.name)}
                {contact.online && <span className="new-chat-online" />}
              </span>

              <span className="new-chat-info">
                <span className="new-chat-name">{contact.name}</span>
                {contact.subtitle && (
                  <span className="new-chat-sub">{contact.subtitle}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}