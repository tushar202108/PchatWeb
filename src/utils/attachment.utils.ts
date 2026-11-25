
import type { Attachment, AttachmentItem } from "../types/attachment.types";

export const getAttachment = (file: AttachmentItem): Attachment => {
  if (file instanceof Blob) {
    return {
      name: file instanceof File ? file.name : "Attachment",
      type: file.type,
      size: file.size,
      file,
    };
  }

  return file;
};

export const isImageAttachment = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(attachment.name)
  );
};

export const isVideoAttachment = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.type?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov|m4v|avi)$/i.test(attachment.name)
  );
};

export const isAudioAttachment = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.type?.startsWith("audio/") ||
    /\.(mp3|wav|ogg|oga|aac|m4a|wma|flac|opus|aiff)$/i.test(
      attachment.name
    )
  );
};

export const getAttachmentKey = (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  return (
    attachment.id ||
    attachment.storageKey ||
    attachment.url ||
    attachment.name
  );
};

export const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getAttachmentMimeType = (
  type?: string,
  fileName?: string
): string => {
  if (type && type !== "application/octet-stream") {
    return type;
  }

  const extension = fileName?.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    opus: "audio/opus",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
    wma: "audio/x-ms-wma",
    aiff: "audio/aiff",

    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    avi: "video/x-msvideo",

    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    avif: "image/avif",

    pdf: "application/pdf",
  };

  return mimeTypes[extension ?? ""] || type || "application/octet-stream";
};

const normalizeDataUrl = (
  dataUrl: string,
  mimeType: string
): string => {
  if (/^data:application\/octet-stream;base64,/i.test(dataUrl)) {
    return dataUrl.replace(
      /^data:application\/octet-stream/i,
      `data:${mimeType}`
    );
  }

  return dataUrl;
};

export const loadAttachmentUrl = async (file: AttachmentItem) => {
  const attachment = getAttachment(file);

  const mimeType = getAttachmentMimeType(
    attachment.type,
    attachment.name
  );

  // Temporary File / Blob attachment
  if (attachment.file instanceof Blob) {
    const blob = new Blob([attachment.file], {
      type: mimeType,
    });

    return URL.createObjectURL(blob);
  }

  if (file instanceof Blob) {
    const blob = new Blob([file], {
      type: mimeType,
    });

    return URL.createObjectURL(blob);
  }

  // Existing preview URL
  if (attachment.previewUrl) {
    return attachment.previewUrl;
  }

  // Electron local attachment
  if (attachment.storageKey) {
    const result = await window.chatStorage.getAttachment(
      attachment.storageKey
    );

    if (!result) {
      throw new Error(
        `Attachment not found: ${attachment.storageKey}`
      );
    }

    if (result.startsWith("data:")) {
      return normalizeDataUrl(result, mimeType);
    }

    // Raw base64 response
    return `data:${mimeType};base64,${result}`;
  }

  if (attachment.dataUrl) {
    return normalizeDataUrl(attachment.dataUrl, mimeType);
  }

  if (attachment.url) {
    return attachment.url;
  }

  throw new Error(
    `No playable source found for ${attachment.name}`
  );
};
