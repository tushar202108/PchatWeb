import { useEffect, useState } from "react";
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
import { ProfileImage } from "../../services/ProfileImageService";
import "../../index.css";

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

  const [profileImage, setProfileImage] = useState("");

  const isGroup = Boolean(
    item.isGroup || item.groupId || item.id.startsWith("group-")
  );

  // item.id = peer ID (44), item.userId = logged-in user's ID (42)
  const peerUserId = !isGroup ? item.id : undefined;

  useEffect(() => {
    let cancelled = false;

    setProfileImage("");

    if (!peerUserId) return;

    const loadProfileImage = async () => {
      try {
        const imageUrl = await ProfileImage.getProfileImage(peerUserId);

        if (!cancelled) {
          setProfileImage(imageUrl);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileImage("");
        }

        console.error("Peer profile image loading failed:", peerUserId, error);
      }
    };

    void loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [peerUserId]);
  

    console.log("SIDEBAR PROFILE DEBUG:", {
  itemId: item.id,
  conversationId: (item as any).conversationId,
  userId: item.userId,
  peerUserId,
});

  return (
    <Dropdown
      trigger={["contextMenu"]}
      overlayClassName="stylish-dropdown-overlay"
      menu={{
        style: {
          background: "var(--primary-hover)",
          padding: "4px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        items: [
          {
            key: "delete",
            label: isGroup ? "delete group" : "Delete conversation",
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
            className="conversation-last-message"
            avatar={
              <Avatar
                src={!isGroup ? profileImage || undefined : undefined}
                icon={
                  profileImage && !isGroup
                    ? undefined
                    : isGroup
                      ? <TeamOutlined />
                      : <UserOutlined />
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