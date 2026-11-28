
import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Input,
    Modal,
    Progress,
    Space,
    Typography,
    message,
} from "antd";
import {
    LeftOutlined,
    RightOutlined,
    RotateRightOutlined,
    EditOutlined,
    CompressOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import "../../../index.css";
const { Text } = Typography;

interface Props {
    files: File[];
    onApply: (files: File[]) => void;
    onCancel: () => void;
}

interface MediaOverlay {
    id: string;
    type: "text" | "sticker";
    content: string;
    x: number;
    y: number;
}

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const IMAGE_QUALITY = 0.82;

const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(0)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

const MediaEditor: React.FC<Props> = ({ files, onApply, onCancel }) => {
    const [index, setIndex] = useState(0);
    const [working, setWorking] = useState(false);
    const [progress, setProgress] = useState(0);

    const [showStickers, setShowStickers] = useState(false);
    const [textValue, setTextValue] = useState("");
    const [overlays, setOverlays] = useState<MediaOverlay[]>([]);
    const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);

    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);

    const [brushColor, setBrushColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(5);
    const [videoUrl, setVideoUrl] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const drawingRef = useRef(false);
    const draggingOverlayRef = useRef<string | null>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const currentFile = files[index];
    const isImage = currentFile?.type.startsWith("image/");
    const isVideo = currentFile?.type.startsWith("video/");

    useEffect(() => {
        setOverlays([]);
        setSelectedOverlay(null);
        setShowStickers(false);
        setTextValue("");
        setTrimStart(0);
        setTrimEnd(0);
        setVideoDuration(0);

        if (!currentFile || !isImage) return;

        const url = URL.createObjectURL(currentFile);
        const image = new Image();

        image.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const scale = Math.min(
                1,
                MAX_IMAGE_WIDTH / image.width,
                MAX_IMAGE_HEIGHT / image.height
            );

            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);

            canvas.getContext("2d")?.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );
        };

        image.src = url;

        return () => URL.revokeObjectURL(url);
    }, [currentFile, isImage]);


    useEffect(() => {
        if (!currentFile || !isVideo) {
            setVideoUrl("");
            return;
        }

        const url = URL.createObjectURL(currentFile);
        setVideoUrl(url);

        setVideoDuration(0);
        setTrimStart(0);
        setTrimEnd(0);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [currentFile, isVideo]);

    // ---------------- IMAGE DRAWING ----------------

    const getCanvasPoint = (
        event: React.PointerEvent<HTMLCanvasElement>
    ) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (working) return;

        drawingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);

        const point = getCanvasPoint(event);
        const context = canvasRef.current?.getContext("2d");

        if (!context) return;

        context.beginPath();
        context.moveTo(point.x, point.y);
        context.strokeStyle = brushColor;
        context.lineWidth = brushSize;
        context.lineCap = "round";
        context.lineJoin = "round";
    };

    const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;

        const point = getCanvasPoint(event);
        const context = canvasRef.current?.getContext("2d");

        if (!context) return;

        context.lineTo(point.x, point.y);
        context.stroke();
    };

    const stopDrawing = () => {
        drawingRef.current = false;
    };

    // ---------------- TEXT AND STICKERS ----------------

    const addOverlay = (type: "text" | "sticker", content: string) => {
        const overlay: MediaOverlay = {
            id: crypto.randomUUID(),
            type,
            content,
            x: 50,
            y: 50,
        };

        setOverlays((previous) => [...previous, overlay]);
        setSelectedOverlay(overlay.id);
    };

    const addText = () => {
        const text = textValue.trim();
        if (!text) return;

        addOverlay("text", text);
        setTextValue("");
    };

    const addSticker = (emoji: EmojiClickData) => {
        addOverlay("sticker", emoji.emoji);
        setShowStickers(false);
    };

    const moveOverlay = (
        event: React.PointerEvent<HTMLDivElement>,
        overlayId: string
    ) => {
        if (working || !stageRef.current) return;

        event.preventDefault();
        event.stopPropagation();

        draggingOverlayRef.current = overlayId;
        setSelectedOverlay(overlayId);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const updateOverlayPosition = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const overlayId = draggingOverlayRef.current;
        const stage = stageRef.current;

        if (!overlayId || !stage) return;

        const rect = stage.getBoundingClientRect();

        const x = Math.max(
            0,
            Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)
        );

        const y = Math.max(
            0,
            Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)
        );

        setOverlays((previous) =>
            previous.map((item) =>
                item.id === overlayId ? { ...item, x, y } : item
            )
        );
    };

    const stopMovingOverlay = () => {
        draggingOverlayRef.current = null;
    };

    const removeSelectedOverlay = () => {
        if (!selectedOverlay) return;

        setOverlays((previous) =>
            previous.filter((item) => item.id !== selectedOverlay)
        );

        setSelectedOverlay(null);
    };

    // ---------------- IMAGE ROTATION ----------------

    const rotateImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        const imageData = context.getImageData(0, 0, oldWidth, oldHeight);

        const temporary = document.createElement("canvas");
        temporary.width = oldWidth;
        temporary.height = oldHeight;

        temporary.getContext("2d")?.putImageData(imageData, 0, 0);

        canvas.width = oldHeight;
        canvas.height = oldWidth;

        const newContext = canvas.getContext("2d");
        if (!newContext) return;

        newContext.translate(canvas.width / 2, canvas.height / 2);
        newContext.rotate(Math.PI / 2);
        newContext.drawImage(temporary, -oldWidth / 2, -oldHeight / 2);
    };

    // ---------------- IMAGE COMPRESSION ----------------

    const compressImage = async (file: File): Promise<File> => {
        if (!file.type.startsWith("image/")) return file;

        const url = URL.createObjectURL(file);

        try {
            const image = new Image();

            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = reject;
                image.src = url;
            });

            const scale = Math.min(
                1,
                MAX_IMAGE_WIDTH / image.width,
                MAX_IMAGE_HEIGHT / image.height
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));

            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not create image canvas");

            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (result) =>
                        result
                            ? resolve(result)
                            : reject(new Error("Image compression failed")),
                    file.type === "image/png" ? "image/png" : "image/jpeg",
                    IMAGE_QUALITY
                );
            });

            return new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now(),
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    // ---------------- VIDEO COMPRESSION ----------------

    const getFFmpeg = async () => {
        if (ffmpegRef.current?.loaded) {
            return ffmpegRef.current;
        }

        const ffmpeg = new FFmpeg();

        ffmpeg.on("progress", ({ progress: value }) => {
            setProgress(Math.min(99, Math.round(value * 100)));
        });

        ffmpeg.on("log", ({ message: logMessage }) => {
            console.log("[FFmpeg]", logMessage);
        });

        try {
            const baseURL =
                "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

            const [coreURL, wasmURL] = await Promise.all([
                toBlobURL(
                    `${baseURL}/ffmpeg-core.js`,
                    "text/javascript"
                ),
                toBlobURL(
                    `${baseURL}/ffmpeg-core.wasm`,
                    "application/wasm"
                ),
            ]);

            await ffmpeg.load({
                coreURL,
                wasmURL,
            });

            ffmpegRef.current = ffmpeg;

            console.log("FFmpeg initialized successfully");

            return ffmpeg;
        } catch (error) {
            console.error("FFmpeg initialization failed:", error);
            throw new Error(
                "FFmpeg could not initialize. Check the FFmpeg core files and network connection."
            );
        }
    };

    const readVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            const url = URL.createObjectURL(file);

            const cleanup = () => {
                video.removeAttribute("src");
                video.load();
                URL.revokeObjectURL(url);
            };

            video.preload = "metadata";

            video.onloadedmetadata = () => {
                const duration = video.duration;
                cleanup();

                if (!Number.isFinite(duration) || duration <= 0) {
                    reject(new Error("Could not read video duration"));
                    return;
                }

                resolve(duration);
            };

            video.onerror = () => {
                cleanup();
                reject(new Error("Could not read the selected video"));
            };

            video.src = url;
        });
    };
    const compressVideo = async (file: File): Promise<File> => {
        const ffmpeg = await getFFmpeg();

        const uniqueId = crypto.randomUUID();
        const inputName = `input-${uniqueId}.mp4`;
        const outputName = `output-${uniqueId}.mp4`;

        try {
            const actualDuration = await readVideoDuration(file);

            const start = Math.max(
                0,
                Math.min(trimStart, actualDuration)
            );

            const requestedEnd =
                trimEnd > 0 ? trimEnd : actualDuration;

            const end = Math.min(requestedEnd, actualDuration);
            const duration = end - start;

            if (duration <= 0) {
                throw new Error(
                    `Invalid trim range: start=${start}, end=${end}`
                );
            }

            console.log("Video processing:", {
                name: file.name,
                size: file.size,
                duration: actualDuration,
                trimStart: start,
                trimEnd: end,
                selectedDuration: duration,
            });

            await ffmpeg.writeFile(inputName, await fetchFile(file));

            const exitCode = await ffmpeg.exec([
                "-i", inputName,
                "-ss", String(start),
                "-t", String(duration),
                "-vf", "scale=1280:-2",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", "28",
                "-c:a", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                outputName,
            ]);

            if (exitCode !== 0) {
                throw new Error(`FFmpeg encoding failed with exit code ${exitCode}`);
            }

            const data = await ffmpeg.readFile(outputName);

            if (!data || data.length === 0) {
                throw new Error("FFmpeg generated an empty video");
            }

            const blob = new Blob([data as BlobPart], {
                type: "video/mp4",
            });

            const baseName = file.name.replace(/\.[^/.]+$/, "");

            return new File([blob], `${baseName}.mp4`, {
                type: "video/mp4",
                lastModified: Date.now(),
            });
        } finally {
            try {
                await ffmpeg.deleteFile(inputName);
            } catch {
                // Temporary input may already be deleted.
            }

            try {
                await ffmpeg.deleteFile(outputName);
            } catch {
                // Temporary output may not exist.
            }
        }
    };
    // ---------------- VIDEO PREVIEW ----------------

    const handleVideoMetadata = (
        event: React.SyntheticEvent<HTMLVideoElement>
    ) => {
        const duration = event.currentTarget.duration;

        console.log("Video metadata loaded:", {
            name: currentFile.name,
            type: currentFile.type,
            duration,
        });

        if (Number.isFinite(duration) && duration > 0) {
            setVideoDuration(duration);
            setTrimStart(0);
            setTrimEnd(duration);
        }
    };

    const handleVideoError = (
        event: React.SyntheticEvent<HTMLVideoElement>
    ) => {
        console.error("Video preview error:", {
            fileName: currentFile.name,
            fileType: currentFile.type,
            error: event.currentTarget.error,
        });

        message.error("Unable to read this video's duration.");
    };

    const handleVideoTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.currentTime >= trimEnd) {
            video.pause();
            video.currentTime = trimStart;
        }
    };

    const handleTrimStartChange = (value: number) => {
        const next = Math.max(0, Math.min(value, trimEnd - 0.2));
        setTrimStart(next);

        const video = videoRef.current;
        if (video && video.currentTime < next) {
            video.currentTime = next;
        }
    };

    const handleTrimEndChange = (value: number) => {
        const next = Math.min(videoDuration, Math.max(value, trimStart + 0.2));
        setTrimEnd(next);

        const video = videoRef.current;
        if (video && video.currentTime > next) {
            video.currentTime = next;
        }
    };

    // ---------------- EXPORT IMAGE WITH OVERLAYS ----------------

    const exportEditedImage = async (file: File): Promise<File> => {
        const sourceCanvas = canvasRef.current;
        if (!sourceCanvas) throw new Error("Image canvas unavailable");

        const canvas = document.createElement("canvas");
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not export image");

        // Copy the image and brush drawings.
        context.drawImage(sourceCanvas, 0, 0);

        // Draw movable text and stickers onto the exported image.
        overlays.forEach((overlay) => {
            const x = (overlay.x / 100) * canvas.width;
            const y = (overlay.y / 100) * canvas.height;

            context.save();
            context.textAlign = "center";
            context.textBaseline = "middle";

            if (overlay.type === "sticker") {
                context.font = `${Math.max(42, canvas.width * 0.12)}px Arial`;
                context.fillText(overlay.content, x, y);
            } else {
                context.font = `bold ${Math.max(24, canvas.width * 0.045)}px Arial`;
                context.lineWidth = 4;
                context.strokeStyle = "#000000";
                context.fillStyle = "#ffffff";

                const lines = overlay.content.split("\n");
                const lineHeight = Math.max(30, canvas.width * 0.055);
                const startY = y - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, lineIndex) => {
                    const lineY = startY + lineIndex * lineHeight;
                    context.strokeText(line, x, lineY);
                    context.fillText(line, x, lineY);
                });
            }

            context.restore();
        });

        const outputType =
            file.type === "image/png" ? "image/png" : "image/jpeg";

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (result) =>
                    result
                        ? resolve(result)
                        : reject(new Error("Could not export edited image")),
                outputType,
                IMAGE_QUALITY
            );
        });

        const extension = outputType === "image/png" ? ".png" : ".jpg";
        const name = file.name.replace(/\.[^/.]+$/, "") + extension;

        return new File([blob], name, {
            type: outputType,
            lastModified: Date.now(),
        });
    };
    const applyChanges = async () => {
        setWorking(true);
        setProgress(0);

        try {
            const output: File[] = [];

            for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                const file = files[fileIndex];

                if (fileIndex === index && isImage) {
                    output.push(await exportEditedImage(file));
                } else if (fileIndex === index && isVideo) {
                    output.push(await compressVideo(file));
                } else if (file.type.startsWith("image/")) {
                    output.push(await compressImage(file));
                } else {
                    output.push(file);
                }

                setProgress(
                    Math.round(((fileIndex + 1) / files.length) * 100)
                );
            }

            onApply(output);
        } catch (error) {
            console.error("Media processing failed:", error);
            message.error("Could not process this media. Please try again.");
        } finally {
            setWorking(false);
        }
    };

    if (!currentFile) return null;

    return (
        <>

            <Modal
                open
                className="media-editor-modal"
                title={`Edit media (${index + 1}/${files.length})`}
                width={850}
                centered
                onCancel={working ? undefined : onCancel}
                closable={!working}
                maskClosable={false}
                styles={{
                    container: {
                        background: "var(--modal-bg)",
                        backgroundImage: "var(--modal-gradient)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--glass-shadow)",
                    },
                } as any}
                footer={[
                    <Button
                        key="cancel"
                        onClick={onCancel}
                        disabled={working}
                        style={{
                            background: "var(--surface)",
                            color: "var(--text-primary)",
                            borderColor: "var(--border)",
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="apply"
                        type="primary"
                        icon={<CompressOutlined />}
                        loading={working}
                        onClick={applyChanges}
                        style={{
                            background: "var(--primary)",
                            borderColor: "var(--primary)",
                            color: "var(--primary-text)",
                        }}
                    >
                        Add to message
                    </Button>,
                ]}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div
                        className="media-stage"
                        style={{
                            minHeight: 300,
                            maxHeight: 460,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: 10,
                            padding: 10,
                            overflow: "hidden",
                        }}
                    >
                        {isImage && (
                            <div
                                ref={stageRef}
                                className="media-canvas-wrap"
                            >
                                <canvas
                                    ref={canvasRef}
                                    className="media-canvas"
                                    onPointerDown={startDrawing}
                                    onPointerMove={draw}
                                    onPointerUp={stopDrawing}
                                    onPointerCancel={stopDrawing}
                                    onPointerLeave={stopDrawing}
                                    style={{
                                        cursor: "crosshair",
                                    }}
                                />

                                <div className="overlay-layer">
                                    {overlays.map((overlay) => (
                                        <div
                                            key={overlay.id}
                                            className={`media-overlay ${overlay.type === "text"
                                                ? "text-overlay"
                                                : "sticker-overlay"
                                                } ${selectedOverlay === overlay.id
                                                    ? "selected"
                                                    : ""
                                                }`}
                                            style={{
                                                left: `${overlay.x}%`,
                                                top: `${overlay.y}%`,
                                            }}
                                            onPointerDown={(event) =>
                                                moveOverlay(event, overlay.id)
                                            }
                                            onPointerMove={updateOverlayPosition}
                                            onPointerUp={stopMovingOverlay}
                                            onPointerCancel={stopMovingOverlay}
                                            onLostPointerCapture={stopMovingOverlay}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedOverlay(overlay.id);
                                            }}
                                        >
                                            {overlay.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isVideo && (
                            <video
                                ref={videoRef}
                                src={videoUrl || undefined}
                                controls
                                preload="metadata"
                                playsInline
                                onLoadedMetadata={handleVideoMetadata}
                                onDurationChange={handleVideoMetadata}
                                onError={handleVideoError}
                                onTimeUpdate={handleVideoTimeUpdate}
                                style={{
                                    width: "100%",
                                    maxWidth: 650,
                                    maxHeight: 430,
                                    objectFit: "contain",
                                    background: "#000",
                                    borderRadius: 8,
                                }}
                            />
                        )}

                        {!isImage && !isVideo && (
                            <div style={{ textAlign: "center" }}>
                                <Text>{currentFile.name}</Text>
                                <div>{formatSize(currentFile.size)}</div>
                            </div>
                        )}
                    </div>

                    {/* MULTI-FILE NAVIGATION */}

                    {files.length > 1 && (
                        <Space style={{ justifyContent: "center" }}>
                            <Button
                                icon={<LeftOutlined />}
                                disabled={index === 0 || working}
                                onClick={() => setIndex((value) => value - 1)}
                            />

                            <Text>
                                {index + 1} of {files.length}
                            </Text>

                            <Button
                                icon={<RightOutlined />}
                                disabled={index === files.length - 1 || working}
                                onClick={() => setIndex((value) => value + 1)}
                            />
                        </Space>
                    )}

                    {/* IMAGE EDITING TOOLS */}

                    {isImage && (
                        <>
                            <Space wrap>
                                <Button
                                    icon={<RotateRightOutlined />}
                                    onClick={rotateImage}
                                    disabled={working}
                                >
                                    Rotate
                                </Button>

                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() =>
                                        setShowStickers((value) => !value)
                                    }
                                    disabled={working}
                                >
                                    Stickers
                                </Button>

                                <Input
                                    value={textValue}
                                    onChange={(event) =>
                                        setTextValue(event.target.value)
                                    }
                                    onPressEnter={addText}
                                    placeholder="Write text on photo"
                                    style={{ width: 190 }}
                                    disabled={working}
                                />

                                <Button
                                    onClick={addText}
                                    disabled={!textValue.trim() || working}
                                >
                                    Add text
                                </Button>

                                {selectedOverlay && (
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={removeSelectedOverlay}
                                        disabled={working}
                                    >
                                        Remove selected
                                    </Button>
                                )}
                            </Space>

                            <Text className="editor-muted">
                                Drag text or stickers on the photo to move them.
                                Select an item and use Remove selected to delete it.
                            </Text>

                            <Space wrap>
                                <Text>Brush:</Text>

                                {[
                                    "#ffffff",
                                    "#ff3b30",
                                    "#ffcc00",
                                    "#34c759",
                                    "#007aff",
                                    "#000000",
                                ].map((color) => (
                                    <Button
                                        key={color}
                                        onClick={() => setBrushColor(color)}
                                        style={{
                                            width: 26,
                                            minWidth: 26,
                                            height: 26,
                                            padding: 0,
                                            background: color,
                                            border:
                                                brushColor === color
                                                    ? "3px solid var(--primary, #0d9489)"
                                                    : "1px solid #888",
                                        }}
                                    />
                                ))}

                                <Input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={brushSize}
                                    onChange={(event) =>
                                        setBrushSize(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    30,
                                                    Number(event.target.value) || 1
                                                )
                                            )
                                        )
                                    }
                                    style={{ width: 75 }}
                                />
                            </Space>

                            {showStickers && (
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <EmojiPicker onEmojiClick={addSticker} />
                                </div>
                            )}
                        </>
                    )}

                    {/* WHATSAPP-STYLE VIDEO TRIM */}


                    {isVideo && (
                        <div>
                            <Text strong>Trim video</Text>

                            {videoDuration > 0 ? (
                                <>
                                    <div className="video-trim-track">
                                        <div
                                            className="video-trim-selected"
                                            style={{
                                                left: `${(trimStart / videoDuration) * 100}%`,
                                                width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                                            }}
                                        />

                                        <input
                                            type="range"
                                            min={0}
                                            max={videoDuration}
                                            step={0.1}
                                            value={trimStart}
                                            onChange={(event) =>
                                                handleTrimStartChange(Number(event.target.value))
                                            }
                                            disabled={working}
                                        />

                                        <input
                                            type="range"
                                            min={0}
                                            max={videoDuration}
                                            step={0.1}
                                            value={trimEnd}
                                            onChange={(event) =>
                                                handleTrimEndChange(Number(event.target.value))
                                            }
                                            disabled={working}
                                        />
                                    </div>

                                    <div className="trim-time">
                                        <span>Start: {trimStart.toFixed(1)}s</span>
                                        <span>End: {trimEnd.toFixed(1)}s</span>
                                    </div>

                                    <Text className="editor-muted">
                                        Selected duration: {(trimEnd - trimStart).toFixed(1)}s /{" "}
                                        {videoDuration.toFixed(1)}s
                                    </Text>
                                </>
                            ) : (
                                <Text type="secondary">
                                    Loading video duration... If this remains unavailable, the
                                    browser may not support this video's codec.
                                </Text>
                            )}
                        </div>
                    )}

                    <Text className="editor-muted">
                        Original size: {formatSize(currentFile.size)}
                    </Text>

                    {working && (
                        <Progress percent={progress} status="active" />
                    )}
                </div>
            </Modal>
        </>
    );
};

export default MediaEditor;
