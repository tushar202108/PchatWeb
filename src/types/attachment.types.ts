export interface Attachment {
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

export type AttachmentItem = File | Blob | Attachment;

export interface AttachmentComponentProps {
  file: AttachmentItem;
  previewUrl: string;
  onRetry?: (file: AttachmentItem) => void;
}

export interface MessageAttachmentProps {
  file: AttachmentItem;
  attachments?: AttachmentItem[];
  moreCount?: number;
  onRetry?: (file: AttachmentItem) => void;
}