
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "antd";
import {
  PaperClipOutlined,
  LeftOutlined,
  RightOutlined,
  // CloseOutlined,
} from "@ant-design/icons";
import "./AttachmentPicker.css"
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
}

type AttachmentItem = File | Blob | Attachment;

interface MessageAttachmentProps {
  file: AttachmentItem;
  attachments?: AttachmentItem[];
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
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name)
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
    return window.chatStorage.getAttachment(attachment.storageKey);
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
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const attachment = getAttachment(file);
  const fileName = attachment.name || "Attachment";

  const galleryFiles = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments]
  );

  const isImage = isImageAttachment(file);

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
      (item) => getAttachmentKey(item) === getAttachmentKey(file)
    );

    setActiveIndex(index >= 0 ? index : 0);
    setPreviewOpen(true);
  };

  const previousImage = () => {
    setActiveIndex((current) =>
      current === 0 ? galleryFiles.length - 1 : current - 1
    );
  };

  const nextImage = () => {
    setActiveIndex((current) =>
      current === galleryFiles.length - 1 ? 0 : current + 1
    );
  };


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
        <div className="message-image-attachment">
          <img
            src={previewUrl}
            alt={fileName}
            className="message-image-preview"
            onClick={openGallery}
          />
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
              background: "#0A1713",
              padding: 0,
              border: "1px solid #18352B",
              borderRadius: 14,
              overflow: "hidden",
            },
            body: {
              background: "#0A1713",
              padding: 16,
            },
          } as any}
        >
          <div className="image-gallery">
            <div className="image-gallery-main">
              {galleryUrls[activeIndex] && (
                <img
                  src={galleryUrls[activeIndex]}
                  alt={getAttachment(galleryFiles[activeIndex]).name}
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
