
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Drawer,
  Modal,
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

import { ProfileImage } from "../../services/ProfileImageService";
import ConversationWallpaperPicker from "../chat/ConversationWallpaperPicker";
import SharedConversationContent from "../ConversationContent/ConversationContent";
import "./sideDrawer.css";

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
  const [profileImage, setProfileImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const isGroup = Boolean(
    selected?.isGroup ||
    selected?.groupId ||
    selected?.id.startsWith("group-")
  );

  const peerUserId = selected && !isGroup
    ? selected.id
    : undefined;
console.log("peerUserId",peerUserId)
  useEffect(() => {
    let cancelled = false;

    setProfileImage("");
    setPreviewOpen(false);

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

        console.error(
          "Conversation details profile image loading failed:",
          peerUserId,
          error
        );
      }
    };

    void loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [peerUserId]);

  if (!selected) return null;

  const username = String(selected.username ?? "")
    .trim()
    .toLowerCase();

  const isOnline = onlineUsers.some(
    (user) => String(user).trim().toLowerCase() === username
  );

  return (
    <>
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
            <button
              type="button"
              onClick={() => {
                if (profileImage && !isGroup) {
                  setPreviewOpen(true);
                }
              }}
              disabled={!profileImage || isGroup}
              aria-label="View profile picture"
              style={{
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: profileImage && !isGroup ? "pointer" : "default",
                borderRadius: "50%",
              }}
            >
              <Avatar
                size={80}
                src={!isGroup ? profileImage || undefined : undefined}
                icon={
                  profileImage && !isGroup
                    ? undefined
                    : isGroup
                      ? <TeamOutlined />
                      : <UserOutlined />
                }
              />
            </button>

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

          <SharedConversationContent
            key={selected.id}
            messages={messages}
          />
        </div>
      </Drawer>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        closable
        centered
        width="100vw"
        className="profile-image-fullscreen-modal"
        styles={{
          mask: {
            backgroundColor: "rgba(0, 0, 0, 0.95)",
          },
          content: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
          },
          body: {
            height: "90vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          },
        }as any}
      >
        {profileImage && (
          <img
            src={profileImage}
            alt={`${selected.name} profile`}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        )}
      </Modal>
    </>
  );
}
