
import React, { useEffect, useState } from "react";
import { PaperClipOutlined } from "@ant-design/icons";

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

interface MessageAttachmentProps {
  file: File | Blob | Attachment;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const isBlob = file instanceof Blob;

  const attachment: Attachment = isBlob
    ? {
        name: file instanceof File ? file.name : "Attachment",
        type: file.type,
      }
    : (file as Attachment);

  const fileName = attachment.name || "Attachment";
  const fileType = attachment.type || "";

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const loadAttachment = async () => {
      try {
        setLoading(true);

        if (isBlob) {
          objectUrl = URL.createObjectURL(file);

          if (active) setPreviewUrl(objectUrl);
          return;
        }

        if (attachment.storageKey) {
          const localUrl = await window.chatStorage.getAttachment(
            attachment.storageKey
          );

          if (active) setPreviewUrl(localUrl);
          return;
        }

        const existingUrl =
          attachment.url ||
          attachment.dataUrl ||
          attachment.previewUrl ||
          "";

        if (active) setPreviewUrl(existingUrl);

        // Case 4: Blob stored inside attachment object
        if (attachment.file instanceof Blob) {
          objectUrl = URL.createObjectURL(attachment.file);

          if (active) setPreviewUrl(objectUrl);
        }
      } catch (error) {
        console.error("Failed to load attachment:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAttachment();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  const isImage =
    fileType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);

  if (loading) {
    return <div>Loading {fileName}...</div>;
  }

  if (isImage && previewUrl) {
    return (
      <div className="message-image-attachment">
        <img
          src={previewUrl}
          alt={fileName}
          className="message-image-preview"
          onClick={() => window.open(previewUrl, "_blank")}
        />
      </div>
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
