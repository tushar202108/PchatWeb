import React from "react";
import { Progress, Tooltip } from "antd";
import {
  PaperClipOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";

import type { AttachmentComponentProps } from "../../../types/attachment.types";
import { getAttachment } from "../../../utils/attachment.utils";
import "../AttachmentPicker.css"
const FileAttachment: React.FC<AttachmentComponentProps> = ({
  file,
  previewUrl,
  onRetry,
}) => {
  const attachment = getAttachment(file);
  console.log("attachmentStatusForAckno",attachment)
  const isUploading = attachment.uploadStatus === "uploading";
  const isFailed = attachment.uploadStatus === "failed";

  return (
    <div className="message-file-attachment upload-attachment-wrapper">
      <PaperClipOutlined />

      {previewUrl ? (
        <a href={previewUrl} download={attachment.name}>
          {attachment.name}
        </a>
      ) : (
        <span>{attachment.name}</span>
      )}

      {isUploading && (
        <div className="document-upload-progress">
          <Progress
            percent={attachment.uploadProgress ?? 0}
            size="small"
            showInfo
            strokeColor="#10b981"
          />
        </div>
      )}

      {isFailed && (
        <div className="attachment-failed-actions">
          <Tooltip title="Attachment upload failed">
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
    </div>
  );
};

export default FileAttachment;