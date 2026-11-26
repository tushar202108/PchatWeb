import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Empty,
  Modal,
  Button,
  Tabs,
  Typography,
} from "antd";

import {
  FileOutlined,
  LinkOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

import type { ChatMessage } from "../../types/chats.type";
import type { AttachmentItem } from "../../types/attachment.types";

import {
  getAttachment,
  getAttachmentKey,
  isImageAttachment,
  loadAttachmentUrl,
} from "../../utils/attachment.utils";

import "./GroupInfoModal.css";
import "../chat/AttachmentPicker.css";

const { Text } = Typography;

interface Props {
  messages: ChatMessage[];
}

interface SharedFile {
  id: string;
  name: string;
  type: string;
  attachment: AttachmentItem;
}

export default function GroupSharedMedia({ messages }: Props) {
  const [activeTab, setActiveTab] = useState("media");

  // Image gallery state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Collect attachments from all group messages
  const sharedFiles = useMemo<SharedFile[]>(
    () =>
      messages.flatMap((message) =>
        (message.attachments ?? []).map((file, index) => {
          const attachment = file as AttachmentItem;
          const normalized = getAttachment(attachment);

          return {
            id: String(
              (file as any).id ?? `${message.id}-${index}`
            ),
            name: normalized.name ?? "Attachment",
            type: normalized.type ?? "",
            attachment,
          };
        })
      ),
    [messages]
  );

  const images = useMemo(
    () =>
      sharedFiles.filter((file) =>
        isImageAttachment(file.attachment)
      ),
    [sharedFiles]
  );

  const videos = useMemo(
    () =>
      sharedFiles.filter((file) =>
        file.type.startsWith("video/")
      ),
    [sharedFiles]
  );

  const documents = useMemo(
    () =>
      sharedFiles.filter(
        (file) =>
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
      ),
    [sharedFiles]
  );

  const mediaFiles = useMemo(
    () => [...images, ...videos],
    [images, videos]
  );

  // Extract links from messages
  const links = useMemo(
    () =>
      messages.flatMap((message) => {
        const matches =
          message.text?.match(/https?:\/\/[^\s]+/g) ?? [];

        return matches.map((url, index) => ({
          id: `${message.id}-${index}`,
          url,
        }));
      }),
    [messages]
  );

  const renderEmpty = (label: string) => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={`No ${label} shared yet`}
    />
  );

  // Resolve all image URLs using the same utility as ImageAttachment.
  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    const loadImages = async () => {
      try {
        const urls = await Promise.all(
          images.map(async (item) => {
            const attachment = getAttachment(item.attachment);

            const url = await loadAttachmentUrl(
              item.attachment
            );

            if (
              (attachment.file instanceof Blob ||
                item.attachment instanceof Blob) &&
              url.startsWith("blob:")
            ) {
              objectUrls.push(url);
            }

            return url;
          })
        );

        if (active) {
          setGalleryUrls(urls);
        }
      } catch (error) {
        console.error(
          "Failed to load group image gallery:",
          error
        );
      }
    };

    setGalleryUrls([]);
    loadImages();

    return () => {
      active = false;

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [images]);

  // Open gallery at selected image
  const openGallery = useCallback(
    (file: SharedFile) => {
      const index = images.findIndex(
        (item) =>
          getAttachmentKey(item.attachment) ===
          getAttachmentKey(file.attachment)
      );

      setActiveIndex(index >= 0 ? index : 0);
      setPreviewOpen(true);
    },
    [images]
  );

  const previousImage = useCallback(() => {
    setActiveIndex((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveIndex((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!previewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextImage();
      }

      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen, previousImage, nextImage]);

  // Shared media thumbnail grid
  const renderMedia = () => {
    if (!mediaFiles.length) {
      return renderEmpty("media");
    }

    const visibleFiles = mediaFiles.slice(0, 3);
    const remainingCount = mediaFiles.length - 3;

    return (
      <div className="shared-media-grid">
        {visibleFiles.map((file, index) => {
          const isImage = file.type.startsWith("image/");

          const imageIndex = images.findIndex(
            (item) => item.id === file.id
          );

          const imageUrl =
            imageIndex >= 0
              ? galleryUrls[imageIndex]
              : undefined;

          return (
            <div className="shared-media-item" key={file.id}>
              <div
                className="shared-media-preview"
                onClick={() => {
                  if (isImage) {
                    openGallery(file);
                  }
                }}
                style={{
                  cursor: isImage ? "pointer" : "default",
                }}
              >
                {isImage ? (
                  imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={file.name}
                      className="shared-media-image"
                    />
                  ) : (
                    <div className="shared-media-placeholder">
                      <PictureOutlined />
                    </div>
                  )
                ) : (
                  <div className="shared-media-placeholder">
                    <VideoCameraOutlined />
                  </div>
                )}

                {index === 2 && remainingCount > 0 && (
                  <div
                    className="shared-media-more"
                    onClick={(event) => {
                      event.stopPropagation();

                      // Open the gallery at the last visible image.
                      const lastVisibleImage = [...visibleFiles]
                        .reverse()
                        .find((item) =>
                          isImageAttachment(item.attachment)
                        );

                      if (lastVisibleImage) {
                        openGallery(lastVisibleImage);
                      } else if (images.length > 0) {
                        openGallery(images[0]);
                      }
                    }}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>

              <Text ellipsis>{file.name}</Text>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
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
                  <PictureOutlined /> Media ({mediaFiles.length})
                </>
              ),
              children: renderMedia(),
            },
            {
              key: "documents",
              label: (
                <>
                  <FileOutlined /> Docs ({documents.length})
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
                  <LinkOutlined /> Links ({links.length})
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

      {/* Separate image gallery modal */}
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        centered
        width="90%"
        keyboard
        destroyOnHidden
        className="whatsapp-image-modal"
        styles={{
          content: {
            background: "var(--modal-bg)",
            padding: 0,
            border: "1px solid var(--border-strong)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "var(--glass-shadow)",
          },
          container: {
            background: "var(--modal-bg)",
            color: "var(--text-primary)",
            padding: 16,
          },
        } as any}
      >
        <div className="image-gallery">
          <div className="image-gallery-main">
            {galleryUrls[activeIndex] && (
              <img
                src={galleryUrls[activeIndex]}
                alt={
                  images[activeIndex]
                    ? getAttachment(
                        images[activeIndex].attachment
                      ).name
                    : ""
                }
                className="image-gallery-large"
              />
            )}

            {images.length > 1 && (
              <>
                <Button
                  className="gallery-arrow gallery-prev"
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={previousImage}
                />

                <Button
                  className="gallery-arrow gallery-next"
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={nextImage}
                />
              </>
            )}
          </div>

          <div className="image-gallery-info">
            <span>
              {images[activeIndex]
                ? getAttachment(
                    images[activeIndex].attachment
                  ).name
                : ""}
            </span>

            <span>
              {images.length > 0
                ? `${activeIndex + 1} / ${images.length}`
                : ""}
            </span>
          </div>

          <div className="image-gallery-thumbnails">
            {images.map((item, index) => (
              <div
                key={getAttachmentKey(item.attachment)}
                className={`gallery-thumbnail ${
                  activeIndex === index ? "active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {galleryUrls[index] ? (
                  <img
                    src={galleryUrls[index]}
                    alt={item.name}
                  />
                ) : (
                  <span>Loading...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
