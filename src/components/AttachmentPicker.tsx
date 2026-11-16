
import React, { useEffect, useMemo, useRef } from "react";
import { Button, Typography } from "antd";
import {
    PaperClipOutlined,
    CloseOutlined,
    FileOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface AttachmentPickerProps {
    files: File[];
    onChange: (files: File[]) => void;
    disabled?: boolean;
}

const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
    files,
    onChange,
    disabled = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previews = useMemo(
        () =>
            files.map((file) => ({
                file,
                url: file.type.startsWith("image/")
                    ? URL.createObjectURL(file)
                    : null,
            })),
        [files]
    );
    useEffect(() => {
        return () => {
            previews.forEach((preview) => {
                if (preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
        };
    }, [previews]);

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles = Array.from(event.target.files ?? []);

        if (selectedFiles.length > 0) {
            onChange([...files, ...selectedFiles]);
        }

        event.target.value = "";
    };

    const removeFile = (index: number) => {
        onChange(files.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        onChange([]);
    };

    return (
        <div className="attachment-picker">

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
                                {preview.url ? (
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
                                ) : (
                                    <div
                                        style={{
                                            width: 100,
                                            height: 100,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <FileOutlined />
                                        <Text
                                            ellipsis
                                            style={{ color: "#fff", maxWidth: 85, fontSize: 11 }}
                                        >
                                            {preview.file.name}
                                        </Text>
                                    </div>
                                )}

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
                hidden
                onChange={handleFileChange}
            />

            <Button
                type="text"
                icon={<PaperClipOutlined />}
                title="Attach files"
                style={{ color: 'white' }}
                className="attachment-picker-button"
                disabled={disabled}
                onClick={openFilePicker}
            />
        </div>
    );
};

export default AttachmentPicker;
