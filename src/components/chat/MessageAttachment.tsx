
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Button, Progress, Tooltip } from "antd";
import {
  PaperClipOutlined,
  LeftOutlined,
  RightOutlined,
  ExclamationCircleFilled,
  PlayCircleFilled,
} from "@ant-design/icons";

import "./AttachmentPicker.css";

interface Attachment {
  id?: string;
  name: string;
  type?: string;
  size?: number;
  storageKey?: string;
  url?: string;
  dataUrl?: string;
  previewUrl?: string;
  file?: File | Blob;
  uploadProgress?: number;
  uploadStatus?: "uploading" | "uploaded" | "failed";
}

type AttachmentItem = File | Blob | Attachment;

interface MessageAttachmentProps {
  file: AttachmentItem;
  attachments?: AttachmentItem[];
  moreCount?: number;
}

const getAttachment = (file: AttachmentItem): Attachment => {
  if (file instanceof Blob) {
    return {
      name: file instanceof File ? file.name : "Attachment",
      type: file.type,
      file,
    };
  }

  return file;
};

const isImageAttachment = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(
      attachment.name
    )
  );
};
const isVideoAttachment = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.type?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov|m4v|avi)$/i.test(attachment.name)
  );
};

const getAttachmentKey = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.id ||
    attachment.storageKey ||
    attachment.url ||
    attachment.name
  );
};

const loadAttachmentUrl = async (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  if (attachment.file instanceof Blob) {
    return URL.createObjectURL(attachment.file);
  }

  if (file instanceof Blob) {
    return URL.createObjectURL(file);
  }

  if (attachment.storageKey) {
    return window.chatStorage.getAttachment(
      attachment.storageKey
    );
  }

  return (
    attachment.url ||
    attachment.dataUrl ||
    attachment.previewUrl ||
    ""
  );
};

const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  file,
  attachments = [file],
  moreCount = 0,
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const attachment = getAttachment(file);
  const fileName = attachment.name || "Attachment";

  const galleryFiles = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments]
  );

  const isImage = isImageAttachment(file);
  const isVideo = isVideoAttachment(file);

  const uploadStatus = attachment.uploadStatus;
  const uploadProgress = attachment.uploadProgress ?? 0;

  const isUploading = uploadStatus === "uploading";
  const isFailed = uploadStatus === "failed";

  // Load the current attachment thumbnail.
  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const load = async () => {
      try {
        setLoading(true);

        const url = await loadAttachmentUrl(file);

        if (url.startsWith("blob:")) {
          objectUrl = url;
        }

        if (active) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Failed to load attachment:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);
  const handlePlayVideo = async () => {
    try {
      await videoRef.current?.play();
    } catch (error) {
      console.error("Unable to play video:", error);
    }
  };
  // Load all images when the gallery opens.
  useEffect(() => {
    if (!previewOpen) return;

    let active = true;
    const objectUrls: string[] = [];

    const loadGallery = async () => {
      try {
        const urls = await Promise.all(
          galleryFiles.map(async (item) => {
            const url = await loadAttachmentUrl(item);

            if (url.startsWith("blob:")) {
              objectUrls.push(url);
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
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewOpen, galleryFiles]);

  const openGallery = () => {
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

  if (loading) {
    return <div>Loading {fileName}...</div>;
  }

  if (isImage && previewUrl) {
    return (
      <>
        <div className="message-image-attachment upload-attachment-wrapper">
          <img
            src={previewUrl}
            alt={fileName}
            className="message-image-preview"
            onClick={() => {
              if (!isUploading && !isFailed) {
                openGallery();
              }
            }}
          />

          {/* Upload progress */}
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

          {/* Failed upload */}
          {isFailed && (
            <Tooltip title="Attachment upload failed">
              <div className="attachment-failed-indicator">
                <ExclamationCircleFilled />
              </div>
            </Tooltip>
          )}

          {/* Show +N on the fourth image */}
          {moreCount > 0 && (
            <div
              className="message-image-more"
              onClick={openGallery}
            >
              +{moreCount}
            </div>
          )}
        </div>

        {/* Existing full-screen image preview */}
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
            body: {
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
                      ? getAttachment(
                        galleryFiles[activeIndex]
                      ).name
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
                  ? getAttachment(
                    galleryFiles[activeIndex]
                  ).name
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
                  className={`gallery-thumbnail ${activeIndex === index ? "active" : ""
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
  }

  // VIDEO ATTACHMENT
  if (isVideo && previewUrl) {
    return (
      <div className="message-video-attachment upload-attachment-wrapper">
        <video
          ref={videoRef}
          src={previewUrl}
          className="message-video-preview"
          controls={!isUploading}
          muted
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {isUploading && (
          <div className="attachment-upload-overlay">
            <Progress
              type="circle"
              percent={uploadProgress}
              size={48}
              strokeColor="#10b981"
              trailColor="rgba(255,255,255,0.3)"
            />
          </div>
        )}

        {isFailed && (
          <Tooltip title="Video upload failed">
            <div className="attachment-failed-indicator">
              <ExclamationCircleFilled />
            </div>
          </Tooltip>
        )}

        {!isUploading && !isFailed && !isPlaying && (
          <PlayCircleFilled
            className="video-play-indicator"
            onClick={handlePlayVideo}
          />
        )}
      </div>
    );
  }

  // OTHER ATTACHMENTS
  return (
    <div className="message-file-attachment upload-attachment-wrapper">
      <PaperClipOutlined />

      <a href={previewUrl || undefined} download={fileName}>
        {fileName}
      </a>

      {isUploading && (
        <div className="document-upload-progress">
          <Progress
            percent={uploadProgress}
            size="small"
            showInfo
            strokeColor="#10b981"
          />
        </div>
      )}

      {isFailed && (
        <Tooltip title="Attachment upload failed">
          <ExclamationCircleFilled className="attachment-failed-icon" />
        </Tooltip>
      )}
    </div>
  );

  if (previewUrl) {
    return (
      <div className="message-file-attachment">
        <PaperClipOutlined />
        <a href={previewUrl} download={fileName}>
          {fileName}
        </a>
      </div>
    );
  }

  return (
    <div className="message-file-attachment">
      <PaperClipOutlined />
      <span>{fileName}</span>
    </div>
  );
};

export default MessageAttachment;
