
import React, { useRef, useState } from "react";
import { Progress, Tooltip } from "antd";
import {
  ExclamationCircleFilled,
  PlayCircleFilled,
} from "@ant-design/icons";

import type { AttachmentComponentProps } from "../../../types/attachment.types";
import { getAttachment } from "../../../utils/attachment.utils";
import "../AttachmentPicker.css";

const VideoAttachment: React.FC<AttachmentComponentProps> = ({
  file,
  previewUrl,
  onRetry,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const attachment = getAttachment(file);
console.log("VIDEO RETRY DEBUG:", {
  file,
  attachment,
  uploadStatus: attachment.uploadStatus,
  isFailed: attachment.uploadStatus === "failed",
  onRetryExists: !!onRetry,
});
  const isUploading = attachment.uploadStatus === "uploading";
  const isFailed = attachment.uploadStatus === "failed";
  const uploadProgress = attachment.uploadProgress ?? 0;

  const handlePlayVideo = async () => {
    try {
      const video = videoRef.current;

      if (!video || !previewUrl || isUploading || isFailed) return;

      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (error) {
      console.error("Unable to play video:", error);
    }
  };

  const handleRetry = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (onRetry) {
      onRetry(file);
    }
  };

  return (
    <div className="message-video-attachment upload-attachment-wrapper">
      <video
        ref={videoRef}
        src={previewUrl || undefined}
        className="message-video-preview"
        controls={!isUploading && !isFailed}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={(event) => {
          console.error(
            "Video loading failed:",
            event.currentTarget.error
          );
        }}
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
        <Tooltip title="Video upload failed. Click to retry.">
          <button
            type="button"
            className="attachment-retry-button"
            onClick={handleRetry}
          >
            <ExclamationCircleFilled />
          </button>
        </Tooltip>
      )}

      {!isUploading && !isFailed && !isPlaying && previewUrl && (
        <PlayCircleFilled
          className="video-play-indicator"
          onClick={handlePlayVideo}
        />
      )}
    </div>
  );
};

export default VideoAttachment;
