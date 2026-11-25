import React, { useEffect, useRef, useState } from "react";
import { Progress, Tooltip } from "antd";
import {
    AudioOutlined,
    ExclamationCircleFilled,
    PauseCircleFilled,
    PlayCircleFilled,
    SoundOutlined,
} from "@ant-design/icons";

import type {
    AttachmentComponentProps,
} from "../../../types/attachment.types";

import {
    formatAudioTime,
    getAttachment,
} from "../../../utils/attachment.utils";
import "./Audioattachment.css"
const AudioAttachment: React.FC<AttachmentComponentProps> = ({
  file,
  previewUrl,
  onRetry,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const attachment = getAttachment(file);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioError, setAudioError] = useState("");

  const isUploading = attachment.uploadStatus === "uploading";
  const isFailed = attachment.uploadStatus === "failed";

  useEffect(() => {
    const audio = audioRef.current;

    setAudioPlaying(false);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    setAudioError("");

    if (!audio || !previewUrl) return;

    audio.pause();
    audio.load();

    return () => {
      audio.pause();
    };
  }, [previewUrl]);

  const handlePlay = async () => {
    const audio = audioRef.current;

    if (!audio || !previewUrl || isUploading || isFailed) return;

    try {
      setAudioError("");

      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setAudioError("Unable to play audio");
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration)) return;

    audio.currentTime = value;
    setAudioCurrentTime(value);
  };

  const handleVolume = (value: number) => {
    setAudioVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  return (
    <div className="message-audio-attachment upload-attachment-wrapper">
      <audio
        ref={audioRef}
        src={previewUrl || undefined}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;

          setAudioDuration(
            Number.isFinite(duration) ? duration : 0
          );
          setAudioError("");
        }}
        onDurationChange={(event) => {
          const duration = event.currentTarget.duration;

          setAudioDuration(
            Number.isFinite(duration) ? duration : 0
          );
        }}
        onCanPlay={() => setAudioError("")}
        onTimeUpdate={(event) => {
          setAudioCurrentTime(event.currentTarget.currentTime);
        }}
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onEnded={() => {
          setAudioPlaying(false);
          setAudioCurrentTime(0);
        }}
        onError={(event) => {
          const error = event.currentTarget.error;

          console.error("Audio source failed:", {
            code: error?.code,
            message: error?.message,
            source: event.currentTarget.currentSrc,
            fileName: attachment.name,
            mimeType: attachment.type,
          });

          setAudioPlaying(false);
          setAudioError(
            error?.code === 4
              ? "Unsupported audio format or invalid audio source"
              : "Unable to load audio"
          );
        }}
      />

      <div className="audio-player-icon">
        <AudioOutlined />
      </div>

      <div className="audio-player-content">
        <div className="audio-player-top">
          <span className="audio-file-name" title={attachment.name}>
            {attachment.name}
          </span>

          {isFailed && (
            <Tooltip title="Audio upload failed">
              <ExclamationCircleFilled className="attachment-failed-icon" />
            </Tooltip>
          )}
        </div>

        <div className="audio-player-controls">
          <button
            type="button"
            className="audio-play-button"
            onClick={handlePlay}
            disabled={!previewUrl || isUploading || isFailed}
          >
            {audioPlaying ? (
              <PauseCircleFilled />
            ) : (
              <PlayCircleFilled />
            )}
          </button>

          <div className="audio-progress-container">
            <input
              type="range"
              className="audio-progress"
              min={0}
              max={audioDuration || 0}
              step={0.1}
              value={Math.min(audioCurrentTime, audioDuration || 0)}
              onChange={(event) =>
                handleSeek(Number(event.target.value))
              }
              disabled={!audioDuration || isUploading || isFailed}
              style={{
                background: `linear-gradient(to right, var(--accent-color, #10b981) ${
                  audioDuration
                    ? (audioCurrentTime / audioDuration) * 100
                    : 0
                }%, var(--border-strong) 0%)`,
              }}
            />

            <div className="audio-time">
              <span>{formatAudioTime(audioCurrentTime)}</span>
              <span>{formatAudioTime(audioDuration)}</span>
            </div>
          </div>

          <SoundOutlined className="audio-volume-icon" />

          <input
            type="range"
            className="audio-volume"
            min={0}
            max={1}
            step={0.05}
            value={audioVolume}
            onChange={(event) =>
              handleVolume(Number(event.target.value))
            }
            disabled={isUploading || isFailed}
          />
        </div>

        {isUploading && (
          <div className="audio-upload-progress">
            <Progress
              percent={attachment.uploadProgress ?? 0}
              size="small"
              showInfo
            />
          </div>
        )}

        {isFailed && attachment.file && onRetry && (
          <button
            type="button"
            className="attachment-retry-button"
            onClick={() => onRetry(file)}
          >
            Retry upload
          </button>
        )}

        {audioError && (
          <div className="audio-error">{audioError}</div>
        )}
      </div>
    </div>
  );
};

export default AudioAttachment;