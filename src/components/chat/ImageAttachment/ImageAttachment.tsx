import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button, Modal, Progress, Tooltip } from "antd";

import {
  LeftOutlined,
  RightOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";

import type { AttachmentItem } from "../../../types/attachment.types";
import "../AttachmentPicker.css"
import {
  getAttachment,
  getAttachmentKey,
  isImageAttachment,
  loadAttachmentUrl,
} from "../../../utils/attachment.utils";

interface ImageAttachmentProps {
  file: AttachmentItem;
  previewUrl: string;
  attachments?: AttachmentItem[];
  moreCount?: number;
  onRetry?: (file: AttachmentItem) => void;
}

const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  file,
  previewUrl,
  attachments = [file],
  moreCount = 0,
  onRetry,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const attachment = getAttachment(file);

  const isUploading = attachment.uploadStatus === "uploading";
  const isFailed = attachment.uploadStatus === "failed";

  const uploadProgress = attachment.uploadProgress ?? 0;

  const galleryFiles = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments]
  );

  // Load gallery images when the gallery opens.
  useEffect(() => {
    if (!previewOpen) return;

    let active = true;
    const objectUrls: string[] = [];

    const loadGallery = async () => {
      try {
        const urls = await Promise.all(
          galleryFiles.map(async (item) => {
            const itemAttachment = getAttachment(item);

            const url = await loadAttachmentUrl(item);

            // Only revoke URLs created here.
            if (
              itemAttachment.file instanceof Blob ||
              item instanceof Blob
            ) {
              if (url.startsWith("blob:")) {
                objectUrls.push(url);
              }
            }

            return url;
          })
        );

        if (active) {
          setGalleryUrls(urls);
        }
      } catch (error) {
        console.error("Failed to load image gallery:", error);
      }
    };

    loadGallery();

    return () => {
      active = false;

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewOpen, galleryFiles]);

  const openGallery = () => {
    if (isUploading || isFailed) return;

    const index = galleryFiles.findIndex(
      (item) =>
        getAttachmentKey(item) === getAttachmentKey(file)
    );

    setActiveIndex(index >= 0 ? index : 0);
    setPreviewOpen(true);
  };

  const previousImage = useCallback(() => {
    setActiveIndex((current) =>
      current === 0 ? galleryFiles.length - 1 : current - 1
    );
  }, [galleryFiles.length]);

  const nextImage = useCallback(() => {
    setActiveIndex((current) =>
      current === galleryFiles.length - 1 ? 0 : current + 1
    );
  }, [galleryFiles.length]);

  // Keyboard navigation.
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

  return (
    <>
      <div className="message-image-attachment upload-attachment-wrapper">
        <img
          src={previewUrl}
          alt={attachment.name}
          className="message-image-preview"
          onClick={openGallery}
        />

        {isUploading && (
          <div className="attachment-upload-overlay">
            <Progress
              type="circle"
              percent={uploadProgress}
              size={48}
              strokeColor="#10b981"
              trailColor="rgba(255,255,255,0.3)"
              format={(percent) => (
                <span className="attachment-progress-text">
                  {percent}%
                </span>
              )}
            />
          </div>
        )}

        {isFailed && (
          <div className="attachment-failed-overlay">
            <Tooltip title="Image upload failed">
              <ExclamationCircleFilled className="attachment-failed-icon" />
            </Tooltip>

            {attachment.file && onRetry && (
              <button
                type="button"
                className="attachment-retry-button"
                onClick={() => onRetry(file)}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {moreCount > 0 && (
          <div
            className="message-image-more"
            onClick={openGallery}
          >
            +{moreCount}
          </div>
        )}
      </div>

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
                  galleryFiles[activeIndex]
                    ? getAttachment(galleryFiles[activeIndex]).name
                    : ""
                }
                className="image-gallery-large"
              />
            )}

            {galleryFiles.length > 1 && (
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
              {galleryFiles[activeIndex]
                ? getAttachment(galleryFiles[activeIndex]).name
                : ""}
            </span>

            <span>
              {galleryFiles.length > 0
                ? `${activeIndex + 1} / ${galleryFiles.length}`
                : ""}
            </span>
          </div>

          <div className="image-gallery-thumbnails">
            {galleryFiles.map((item, index) => (
              <div
                key={getAttachmentKey(item)}
                className={`gallery-thumbnail ${
                  activeIndex === index ? "active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {galleryUrls[index] ? (
                  <img
                    src={galleryUrls[index]}
                    alt={getAttachment(item).name}
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
};

export default ImageAttachment;