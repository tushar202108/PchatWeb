
import {
  Fragment,
  useLayoutEffect,
  useRef,
} from "react";
import type { CSSProperties } from "react";

import { Dropdown, Typography } from "antd";
import MessageAttachment from "./MessageAttachment";
import {
  MessageOutlined,
  LockOutlined,
  ForwardOutlined,
  ExclamationCircleFilled,
  StopOutlined,
  PushpinOutlined,
  DeleteOutlined,
  CheckOutlined,
  CopyOutlined,
  RotateRightOutlined,
  RotateLeftOutlined,
} from "@ant-design/icons";
// import type { AttachmentItem } from "../../types/attachment.types";
import Title from "antd/es/typography/Title";
import "../../index.css";
import { getAttachment } from "../../utils/attachment.utils";
import { getDateKey, getDateLabel, getMessageDate, getTimeLabel, isImageFile, type Props, type RetryAttachment } from "../../types/MessageList.types";
export default function MessageList({
  messages,
  onDeleteMessageEveryOne,
  wallpaperUrl,
  selectedMessageIds,
  onToggleMessageSelection,
  onRetryAttachment,
  onReplyMessage,
  onCopyMessages,
  onForwardMessages,
  onDeleteMessages,
  pinnedMessageIds,
  onPinMessage,
  onUnpinMessage,
}: Props) {
  const messageListRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const isSelectionMode = selectedMessageIds.length > 0;

  useLayoutEffect(() => {
    const element = messageListRef.current;

    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  let previousDate = "";

  const wallpaperStyle: CSSProperties = wallpaperUrl
    ? {
      backgroundImage: `
          linear-gradient(
            rgba(0, 0, 0, 0.18),
            rgba(0, 0, 0, 0.18)
          ),
          url(${JSON.stringify(wallpaperUrl)})
        `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "local",
    }
    : {
      backgroundColor: "var(--bg-main)",
    };

  return (
    <div
      className={`message-list ${wallpaperUrl ? "has-wallpaper" : ""}`}
      ref={messageListRef}
      style={wallpaperStyle}
    >
      {messages.length === 0 ? (
        <div className="chat-empty-state">
          <div className="chat-empty-card">
            <div className="chat-empty-icon">
              <MessageOutlined />
            </div>

            <Title level={5} className="chat-empty-title">
              No messages yet
            </Title>

            <Typography.Text className="chat-empty-subtitle">
              Send a message to start the conversation.
            </Typography.Text>

            <div className="chat-empty-badge">
              <LockOutlined />
              <span>
                Messages are private to this conversation
              </span>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const messageDate = getMessageDate(message.createdAt);

          const dateKey = messageDate
            ? getDateKey(messageDate)
            : "";

          const showDate =
            Boolean(dateKey) && dateKey !== previousDate;

          if (dateKey) {
            previousDate = dateKey;
          }

          const allAttachments = message.attachments ?? [];

          const imageAttachments = allAttachments.filter(
            isImageFile
          );

          const otherAttachments = allAttachments.filter(
            (file) => !isImageFile(file)
          );

          // Failed images: one retry button for the entire image grid.
          const failedImages = imageAttachments.filter(
            (file) =>
              getAttachment(file).uploadStatus === "failed"
          );

          // Check every attachment type, not just images.
          const hasUploadingAttachments = allAttachments.some(
            (file) =>
              getAttachment(file).uploadStatus === "uploading"
          );

          const hasFailedAttachments = allAttachments.some(
            (file) =>
              getAttachment(file).uploadStatus === "failed"
          );

          const hasPendingAttachments =
            hasUploadingAttachments || hasFailedAttachments;

          const visibleImages = imageAttachments.slice(0, 4);

          const remainingImages =
            imageAttachments.length - visibleImages.length;

          const hasImages = imageAttachments.length > 0;

          const isSelected = selectedMessageIds.includes(
            String(message.id)
          );
          const isPinned = pinnedMessageIds.includes(String(message.id));
          return (
            <Fragment key={message.id}>
              {showDate && messageDate && (
                <div className="message-date-separator">
                  <span>{getDateLabel(messageDate)}</span>
                </div>
              )}

              <Dropdown
                trigger={["contextMenu"]}
                menu={{
                  style: {
                    padding: "4px",
                    borderRadius: "12px",
                    boxShadow: "var(--glass-shadow)",
                    border: "1px solid var(--border-strong)",
                  },
                  items: [
                    {
                      key: "reply",
                      label: "Reply",
                      icon:<RotateLeftOutlined />,
                      disabled: Boolean(message.deleted),
                    },
                    {
                      key: "copy",
                      label: "Copy",
                      icon:<CopyOutlined />,
                      disabled: !message.text || Boolean(message.deleted),
                    },
                    {
                      key: "forward",
                      label: "Forward",
                      icon:<RotateRightOutlined />,
                      disabled: Boolean(message.deleted),
                    },
                    {
                      key: "select",
                      label: isSelected
                        ? "Deselect message"
                        : "Select message",

                      icon: <CheckOutlined />,
                    },
                    {
                      type: "divider",
                    },
                    {
                      key: "delete",
                      label: "Delete for Me",
                      danger: true,
                      icon: <DeleteOutlined />,
                    },
                    ...(message.mine
                      ? [
                        {
                          key: "deleteEveryone",
                          label: "Delete for Everyone",
                          danger: true,
                          icon: <DeleteOutlined />,

                        },
                      ]
                      : []),
                    {
                      key: isPinned ? "unpin" : "pin",
                      label: isPinned ? "Unpin message" : "Pin message",
                      icon: <PushpinOutlined />,
                      disabled: Boolean(message.deleted || message.deletedForEveryone),
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === "reply") {
                      onReplyMessage?.(message);
                    }

                    if (key === "copy") {
                      onCopyMessages([message]);
                    }

                    if (key === "forward") {
                      onForwardMessages([message]);
                    }

                    if (key === "select") {
                      onToggleMessageSelection(message);
                    }

                    if (key === "delete") {
                      onDeleteMessages([message]);
                    }
                    if (key === "deleteEveryone") {
                      onDeleteMessageEveryOne(message);
                    }
                    if (key === "pin") {
                      onPinMessage(message);
                    }

                    if (key === "unpin") {
                      onUnpinMessage(message);
                    }
                  },
                }}
              >
                <div
                id={`message-${String(message.id)}`}
                  className={`message-bubble ${message.mine ? "mine" : "theirs"
                    } ${hasImages ? "has-message-images" : ""} ${isSelected ? "message-selected" : ""
                    }`}
                  onClick={() => {
                    if (isSelectionMode) {
                      onToggleMessageSelection(message);
                    }
                  }}
                  onTouchStart={(event) => {
                    if (isSelectionMode) return;

                    const touch = event.touches[0];

                    swipeStartRef.current = {
                      x: touch.clientX,
                      y: touch.clientY,
                    };
                  }}

                  onTouchEnd={(event) => {
                    if (isSelectionMode || !swipeStartRef.current) return;
                    const touch = event.changedTouches[0];
                    const deltaX = touch.clientX - swipeStartRef.current.x;
                    const deltaY = Math.abs(
                      touch.clientY - swipeStartRef.current.y
                    );
                    swipeStartRef.current = null;
                    if (deltaX >= 70 && deltaY <= 40) {
                      onReplyMessage?.(message);
                    }
                  }}
                >
                  {isSelected && (
                    <div className="message-selection-indicator">
                      ✓
                    </div>
                  )}

                  {message.deleted || message.deletedForEveryone ? (
                    <div className="deleted-message-placeholder">
                      <StopOutlined className="deleted-message-icon" />
                      <span>
                        {message.mine
                          ? "You deleted this message"
                          : "This message was deleted"}
                      </span>
                    </div>
                  ) : (
                    <>
                      {message.forwarded && (
                        <div className="message-forwarded-label">
                          <ForwardOutlined />
                          <span>Forwarded</span>
                        </div>
                      )}

                      {/* Original replied message */}
                      {message.replyTo && (
                        <div className="message-reply-quote">
                          <div className="message-reply-quote-line" />

                          <div className="message-reply-quote-content">
                            <div className="message-reply-quote-sender">
                              {message.replyTo.mine
                                ? "You"
                                : message.replyTo.senderName || "Message"}
                            </div>

                            <div className="message-reply-quote-text">
                              {message.replyTo.text || "📎 Attachment"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Message text */}
                      {message.text && (
                        <div className="message-text">
                          {message.text}
                        </div>
                      )}

                      {/* IMAGE GRID */}
                      {hasImages && (
                        <div className="chat-image-grid-wrapper">
                          <div
                            className={`chat-image-grid count-${visibleImages.length}`}
                          >
                            {visibleImages.map((file, index) => (
                              <div
                                className="chat-image-grid-item"
                                key={file.id || `${file.name}-${index}`}
                              >
                                <MessageAttachment
                                  file={file}
                                  attachments={imageAttachments}
                                  moreCount={
                                    index === 3 ? remainingImages : 0
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          {failedImages.length > 0 && (
                            <button
                              type="button"
                              className="chat-attachment-retry"
                              title={`${failedImages.length} image upload(s) failed. Click to retry.`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                onRetryAttachment?.(failedImages, message);
                              }}
                            >
                              <ExclamationCircleFilled />
                            </button>
                          )}
                        </div>
                      )}

                      {/* VIDEO, AUDIO, DOCUMENTS AND OTHER FILES */}
                      {otherAttachments.map((file, index) => (
                        <MessageAttachment
                          key={file.id || `${file.name}-other-${index}`}
                          file={file}
                          onRetry={(failedFile) => {
                            onRetryAttachment?.(
                              [failedFile as RetryAttachment],
                              message
                            );
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* MESSAGE TIME AND DELIVERY STATUS */}
                  <div className="message-meta">
                    {messageDate && (
                      <span className="message-time">
                        {getTimeLabel(messageDate)}
                      </span>
                    )}

                    {message.mine &&
                      !message.deleted &&
                      !message.deletedForEveryone &&
                      !hasPendingAttachments && (
                        <span
                          className={`message-ticks ${message.status ?? "sent"}`}
                          title={
                            message.status === "read"
                              ? "Read"
                              : message.status === "delivered"
                                ? "Delivered"
                                : "Sent"
                          }
                        >
                          {message.status === "sent" || !message.status
                            ? "✓"
                            : "✓✓"}
                        </span>
                      )}
                  </div>
                </div>
              </Dropdown>
            </Fragment>
          );
        })
      )}
    </div>
  );
}
