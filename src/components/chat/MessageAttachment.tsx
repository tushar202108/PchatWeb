import React, { useEffect, useState } from "react";

import type {
  // AttachmentItem,
  MessageAttachmentProps,
} from "../../types/attachment.types";

import {
  getAttachment,
  isAudioAttachment,
  isImageAttachment,
  isVideoAttachment,
  loadAttachmentUrl,
} from "../../utils/attachment.utils";

import ImageAttachment from "./ImageAttachment/ImageAttachment";
import VideoAttachment from "./VideoAttachment/VideoAttchment";
import AudioAttachment from "./AudioAttachment/AudioAttachment";
import FileAttachment from "./FileAttchment/FileAttchment";

import "./AttachmentPicker.css";

const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  file,
  attachments,
  moreCount = 0,
  onRetry,
}) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const attachment = getAttachment(file);
  const fileName = attachment.name || "Attachment";
console.log("AUDIO ATTACHMENT DEBUG", {
  name: attachment.name,
  type: attachment.type,
  storageKey: attachment.storageKey,
  // previewUrl: url?.substring(0, 100),
});
  const image = isImageAttachment(file);
  const video = isVideoAttachment(file);
  const audio = isAudioAttachment(file);

  // Load attachment preview.
  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const load = async () => {
      try {
        setLoading(true);
        setPreviewUrl("");

        const url = await loadAttachmentUrl(file);
        if (
          url.startsWith("blob:") &&
          (attachment.file instanceof Blob || file instanceof Blob)
        ) {
          objectUrl = url;
        }

        if (active) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error(
          `Failed to load attachment "${fileName}":`,
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
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

  if (loading && !previewUrl) {
    return <div>Loading {fileName}...</div>;
  }

  // IMAGE
  if (image && previewUrl) {
 console.log("GROUP ATTACHMENT URL DETAILS", {
  file,
  keys: Object.keys(file),
  normalized: getAttachment(file),
  normalizedKeys: Object.keys(getAttachment(file)),
  url: (file as any).url,
  fileUrl: (file as any).fileUrl,
  downloadUrl: (file as any).downloadUrl,
  storageKey: (file as any).storageKey,
  previewUrl: (file as any).previewUrl,
});
    return (
      <ImageAttachment
        file={file}
        previewUrl={previewUrl}
        attachments={attachments?.length ? attachments : [file]}
        moreCount={moreCount}
        onRetry={onRetry}
      />
    );
  }

  // VIDEO
  if (video && previewUrl) {
    return (
      <VideoAttachment
        file={file}
        previewUrl={previewUrl}
        onRetry={onRetry}
      />
    );
  }

  // AUDIO
  if (audio) {
    return (
      <AudioAttachment
        file={file}
        previewUrl={previewUrl}
        onRetry={onRetry}
      />
    );
  }

  // OTHER FILES OR FAILED IMAGE/VIDEO PREVIEWS
  return (
    <FileAttachment
      file={file}
      previewUrl={previewUrl}
      onRetry={onRetry}
    />
  );
};

export default MessageAttachment;