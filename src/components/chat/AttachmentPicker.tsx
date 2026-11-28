
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Typography } from "antd";
import {
  PaperClipOutlined,
  CloseOutlined,
  FileOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

import MediaEditor from "./MediaEditor/MediaEditor";

const { Text } = Typography;

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  files,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : null,
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length > 0) {
      setPendingFiles(selectedFiles);
    }

    event.target.value = "";
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleEditorApply = (processedFiles: File[]) => {
    onChange([...files, ...processedFiles]);
    setPendingFiles(null);
  };

  return (
    <div className="attachment-picker">
      {pendingFiles && (
        <MediaEditor
          files={pendingFiles}
          onApply={handleEditorApply}
          onCancel={() => setPendingFiles(null)}
        />
      )}

      {files.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: 0,
            right: 0,
            width: "auto",
            maxWidth: "100%",
            maxHeight: 260,
            padding: 12,
            boxSizing: "border-box",
            background: "#202c33",
            border: "1px solid #34434c",
            borderRadius: 12,
            zIndex: 10000,
            boxShadow: "0 4px 15px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              color: "#fff",
            }}
          >
            <Text style={{ color: "#fff" }} strong>
              {files.length} attachment{files.length > 1 ? "s" : ""}
            </Text>

            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => onChange([])}
              style={{ color: "#fff" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              overflowY: "hidden",
              padding: 4,
            }}
          >
            {previews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                style={{
                  position: "relative",
                  flex: "0 0 100px",
                  width: 100,
                  height: 100,
                  background: "#f3f1f0",
                  borderRadius: 8,
                }}
              >
                {preview.file.type.startsWith("image/") && preview.url ? (
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    style={{
                      display: "block",
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                ) : preview.file.type.startsWith("video/") && preview.url ? (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      position: "relative",
                      background: "#111",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <video
                      src={preview.url}
                      muted
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <PlayCircleOutlined
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#fff",
                        fontSize: 28,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#333",
                      overflow: "hidden",
                    }}
                  >
                    <FileOutlined />
                    <Text
                      ellipsis
                      style={{ color: "#333", maxWidth: 85, fontSize: 11 }}
                    >
                      {preview.file.name}
                    </Text>
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: 4,
                    color: "#fff",
                    background: "rgba(0,0,0,0.65)",
                    borderRadius: 4,
                    padding: "1px 4px",
                    fontSize: 10,
                  }}
                >
                  {formatSize(preview.file.size)}
                </div>

                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => removeFile(index)}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "#37474f",
                    color: "#fff",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        hidden
        onChange={handleFileChange}
      />

      <Button
        type="text"
        icon={<PaperClipOutlined />}
        title="Attach files"
        style={{ color: "white" }}
        className="attachment-picker-button"
        disabled={disabled}
        onClick={openFilePicker}
      />
    </div>
  );
};

export default AttachmentPicker;
