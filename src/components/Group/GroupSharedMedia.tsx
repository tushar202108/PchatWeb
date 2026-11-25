import { useMemo, useState } from "react";
import {
  Empty,
  Image,
  Tabs,
  Typography,
} from "antd";
import {
  FileOutlined,
  LinkOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

import type { ChatMessage } from "../../types/chats.type";
import "./GroupInfoModal.css"
const { Text } = Typography;

interface Props {
  messages: ChatMessage[];
}

interface SharedFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  storageKey?: string;
  previewUrl?: string;
}

export default function GroupSharedMedia({
  messages,
}: Props) {
  const [activeTab, setActiveTab] = useState("media");

  const sharedFiles = useMemo(() => {
    return messages.flatMap((message) =>
      (message.attachments ?? []).map((file) => ({
        id: String(file.id),
        name: file.name ?? "Attachment",
        type: file.type ?? "",
        url: (file as any).url,
        storageKey: (file as any).storageKey,
        previewUrl: (file as any).previewUrl,
      }))
    );
  }, [messages]);

  const images = sharedFiles.filter((file) =>
    file.type.startsWith("image/")
  );

  const videos = sharedFiles.filter((file) =>
    file.type.startsWith("video/")
  );

  const documents = sharedFiles.filter(
    (file) =>
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
  );

  const links = messages.flatMap((message) => {
    const matches =
      message.text?.match(/https?:\/\/[^\s]+/g) ?? [];

    return matches.map((url, index) => ({
      id: `${message.id}-${index}`,
      url,
    }));
  });

  const renderEmpty = (label: string) => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`No ${label} shared yet`}
    />
  );

  const renderMedia = (files: SharedFile[]) => {
    if (!files.length) return renderEmpty("media");

    return (
      <div className="shared-media-grid">
        {files.map((file) => (
          <div className="shared-media-item" key={file.id}>
            {file.previewUrl || file.url ? (
              <Image
                src={file.previewUrl ?? file.url}
                alt={file.name}
                className="shared-media-image"
              />
            ) : (
              <div className="shared-media-placeholder">
                {file.type.startsWith("video/") ? (
                  <VideoCameraOutlined />
                ) : (
                  <PictureOutlined />
                )}
              </div>
            )}
            <Text ellipsis>{file.name}</Text>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="group-shared-media">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="group-shared-media-button"
        items={[
          {
            key: "media",
            label: (
              <>
                <PictureOutlined /> Media
              </>
            ),
            children: renderMedia([...images, ...videos]),
          },
          {
            key: "documents",
            label: (
              <>
                <FileOutlined /> Documents
              </>
            ),
            children: documents.length ? (
              <div className="shared-document-list">
                {documents.map((file) => (
                  <div
                    className="shared-document-item"
                    key={file.id}
                  >
                    <FileOutlined />
                    <div>
                      <Text strong>{file.name}</Text>
                      <Text type="secondary">
                        {file.type || "File"}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              renderEmpty("documents")
            ),
          },
          {
            key: "links",
            label: (
              <>
                <LinkOutlined /> Links
              </>
            ),
            children: links.length ? (
              <div className="shared-document-list">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shared-link-item"
                  >
                    <LinkOutlined />
                    {link.url}
                  </a>
                ))}
              </div>
            ) : (
              renderEmpty("links")
            ),
          },
        ]}
      />
    </div>
  );
}