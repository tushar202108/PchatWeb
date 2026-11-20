
import { Fragment, useLayoutEffect, useRef } from "react";
import { Dropdown, Typography } from "antd";
import MessageAttachment from "./MessageAttachment";
import type { ChatMessage } from "../../types/chats.type";
import "../../index.css";

const { Text } = Typography;

interface Props {
  messages: ChatMessage[];
  conversationImages: any[];
  onDeleteMessage: (message: ChatMessage) => void;
  noMessagesText: string;
}

function getMessageDate(value?: number | string): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return "Today";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimeLabel(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MessageList({
  messages,
  conversationImages,
  onDeleteMessage,
  noMessagesText,
}: Props) {
  const messageListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useLayoutEffect(() => {
    const element = messageListRef.current;

    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  let previousDate = "";

  return (
    <div className="message-list" ref={messageListRef}>
      {messages.length === 0 ? (
        <Text type="secondary">{noMessagesText}</Text>
      ) : (
        messages.map((message) => {
          const messageDate = getMessageDate(message.createdAt);

          const dateKey = messageDate
            ? getDateKey(messageDate)
            : "";

          const showDate = Boolean(dateKey) && dateKey !== previousDate;

          if (dateKey) {
            previousDate = dateKey;
          }

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
                      label: "Delete message",
                      danger: true,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === "delete") {
                      onDeleteMessage(message);
                    }
                  },
                }}
              >
                <div
                  className={`message-bubble ${
                    message.mine ? "mine" : "theirs"
                  }`}
                >
                  {message.text && (
                    <div className="message-text">
                      {message.text}
                    </div>
                  )}

                  {message.attachments?.map((file, index) => (
                    <MessageAttachment
                      key={file.id || `${file.name}-${index}`}
                      file={file}
                      attachments={conversationImages}
                    />
                  ))}

                  <div className="message-meta">
                    {messageDate && (
                      <span className="message-time">
                        {getTimeLabel(messageDate)}
                      </span>
                    )}

                    {message.mine && (
                      <span
                        className={`message-ticks ${
                          message.status ?? "sent"
                        }`}
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
