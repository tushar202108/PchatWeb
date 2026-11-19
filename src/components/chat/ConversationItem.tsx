
import {
  Avatar,
  Button,
  Dropdown,
  List,
} from "antd";
import {
  ContainerOutlined,
  RollbackOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { Conversation } from "../../types/chats.type";

interface Props {
  item: Conversation;
  selected: boolean;
  onSelect: (item: Conversation) => void;
  onDelete: (item: Conversation) => void;
  onArchive: (id: string) => void;
}

export default function ConversationItem({
  item,
  selected,
  onSelect,
  onDelete,
  onArchive,
}: Props) {
  return (
    <Dropdown
      trigger={["contextMenu"]}
      overlayClassName="stylish-dropdown-overlay"
      menu={{
        style: {
          background:
            "linear-gradient(135deg, rgb(30, 30, 47) 0%, rgb(8 73 84) 100%)",
          padding: "4px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        items: [
          {
            key: "delete",
            label: "Delete conversation",
            danger: true,
          },
        ],
        onClick: ({ key }) => {
          if (key === "delete") onDelete(item);
        },
      }}
    >
      <div style={{ width: "100%" }}>
        <List.Item
          className={`conversation-item ${selected ? "selected" : ""}`}
          onClick={() => onSelect(item)}
          actions={[
            <div key="meta" className="conversation-side">
              {(item.unread ?? 0) > 0 && (
                <span className="conversation-unread">
                  {item.unread}
                </span>
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
                  onArchive(item.id);
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
      </div>
    </Dropdown>
  );
}
