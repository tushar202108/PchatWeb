
import { Fragment } from "react";
import { Dropdown, Typography } from "antd";
import MessageAttachment from "./MessageAttachment";
import type { ChatMessage } from "../../types/chats.type";
import'../../index.css'
const { Text } = Typography;

interface Props {
  messages: ChatMessage[];
  conversationImages: any[];
  onDeleteMessage: (message: ChatMessage) => void;
  noMessagesText: string;
}

const getDateLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function MessageList({
  messages,
  conversationImages,
  onDeleteMessage,
  noMessagesText,
}: Props) {
  let previousDate = "";

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <Text type="secondary">{noMessagesText}</Text>
      ) : (
        messages.map((message) => {
          const timestamp = message.createdAt ?? Date.now();
          const date = new Date(timestamp);

          const dateKey = [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
          ].join("-");

          const showDate = dateKey !== previousDate;
          previousDate = dateKey;

          return (
            <Fragment key={message.id}>
              {showDate && (
                <div className="message-date-separator">
                  <span>{getDateLabel(timestamp)}</span>
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
                  {message.text && <div>{message.text}</div>}

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

                  {message.attachments?.map((file, index) => (
                    <MessageAttachment
                      key={
                        file.id || `${file.name}-${index}`
                      }
                      file={file}
                      attachments={conversationImages}
                    />
                  ))}
                </div>
              </Dropdown>
            </Fragment>
          );
        })
      )}
    </div>
  );
}
