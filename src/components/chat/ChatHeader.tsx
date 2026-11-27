
import { useEffect, useState } from "react";
import { Avatar, Button } from "antd";
import {
  ArrowLeftOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { Conversation } from "../../types/chats.type";
import { ProfileImage } from "../../services/ProfileImageService";
import "./chatHeader.css";

interface Props {
  selected: Conversation;
  onlineUsers: string[];
  onBack: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeader({
  selected,
  onlineUsers,
  onBack,
  onOpenDetails,
}: Props) {
  const [profileImage, setProfileImage] = useState("");

  const isOnline = onlineUsers.includes(
    String(selected.username ?? "").trim().toLowerCase()
  );

  const isGroup = Boolean(
    selected.isGroup ||
    selected.groupId ||
    selected.id.startsWith("group-")
  );

  const peerUserId = !isGroup ? selected.id : undefined;

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

        console.error("Chat header profile image loading failed:", error);
      }
    };

    void loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [peerUserId]);
  console.log("HEADER PROFILE DEBUG:", {
  selectedId: selected.id,
  conversationId: (selected as any).conversationId,
  userId: selected.userId,
});
useEffect(() => {
  if (isGroup || !peerUserId) return;

  const unsubscribe = ProfileImage.subscribe(
    (updatedUserId, imageUrl) => {
      if (updatedUserId === String(peerUserId)) {
        setProfileImage(imageUrl);
      }
    }
  );

  return unsubscribe;
}, [peerUserId, isGroup]);
  return (
    <div className="chat-header">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        className="mobile-back-btn"
        onClick={onBack}
      />

      <button
        type="button"
        className="chat-header-details"
        onClick={onOpenDetails}
        aria-label="Open chat details"
      >
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

        <div className="user-status-container">
          <div className="user-info">
            <span className="selected-user-name">
              {selected.name}
            </span>

            <span className={isOnline ? "online-status" : "offline-status"}>
              <span
                className={`status-dot ${
                  isOnline ? "online-dot" : "offline-dot"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
