
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Empty,
    Image,
    Modal,
    Spin,
    Tabs,
    Typography,
} from "antd";

import {
    DownloadOutlined,
    FileExcelOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import "../sideDrawer/sideDrawer.css"
import type { ChatMessage } from "../../types/chats.type";

type Attachment = NonNullable<ChatMessage["attachments"]>[number];

interface Props {
    messages: ChatMessage[];
}

interface SharedLink {
    url: string;
}

const { Text } = Typography;

const getFileKey = (file: Attachment) =>
    file.storageKey || String(file.id);

const isImage = (file: Attachment) =>
    file.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);

const isVideo = (file: Attachment) =>
    file.type?.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|avi)$/i.test(file.name);

const formatFileSize = (size?: number) => {
    if (!size) return "";

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (file: Attachment) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "pdf") return <FilePdfOutlined />;
    if (["doc", "docx"].includes(extension || "")) {
        return <FileWordOutlined />;
    }
    if (["xls", "xlsx", "csv"].includes(extension || "")) {
        return <FileExcelOutlined />;
    }

    return <FileOutlined />;
};

export default function SharedConversationContent({
    messages,
}: Props) {
    const [mediaSources, setMediaSources] = useState<Record<string, string>>(
        {},
    );
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [showAllMedia, setShowAllMedia] = useState(false);

    const attachments = useMemo(
        () => messages.flatMap((message) => message.attachments ?? []),
        [messages],
    );

    const media = useMemo(
        () => attachments.filter((file) => isImage(file) || isVideo(file)),
        [attachments],
    );

    const documents = useMemo(
        () => attachments.filter((file) => !isImage(file) && !isVideo(file)),
        [attachments],
    );

    const links = useMemo<SharedLink[]>(() => {
        const foundLinks = messages.flatMap((message) => {
            const matches =
                message.text?.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? [];

            return matches.map((url) => ({
                url: url.replace(/[.,!?;:]+$/, ""),
            }));
        });

        return Array.from(
            new Map(foundLinks.map((item) => [item.url, item])).values(),
        );
    }, [messages]);

    const visibleMedia = media.slice(0, 6);
    const remainingMedia = Math.max(0, media.length - 6);

    useEffect(() => {
        let cancelled = false;

        const loadMedia = async () => {
            setLoadingMedia(true);

            const sources: Record<string, string> = {};

            try {
                await Promise.all(
                    media.map(async (file) => {
                        if (!file.storageKey) return;

                        try {
                            const source = await window.chatStorage.getAttachment(
                                file.storageKey,
                            );

                            sources[getFileKey(file)] = source;
                        } catch (error) {
                            console.error(
                                "Failed to load shared media:",
                                file.name,
                                error,
                            );
                        }
                    }),
                );

                if (!cancelled) {
                    setMediaSources(sources);
                }
            } finally {
                if (!cancelled) {
                    setLoadingMedia(false);
                }
            }
        };

        if (media.length > 0) {
            void loadMedia();
        } else {
            setMediaSources({});
            setLoadingMedia(false);
        }

        return () => {
            cancelled = true;
        };
    }, [media]);

    const handleDownload = async (file: Attachment) => {
        if (!file.storageKey) return;

        try {
            const dataUrl = await window.chatStorage.getAttachment(
                file.storageKey,
            );

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download attachment:", error);
        }
    };

    const renderMediaItem = (file: Attachment, index: number) => {
        const key = getFileKey(file);
        const source = mediaSources[key];
        const isMoreTile = index === 5 && remainingMedia > 0;

        return (
            <div
                key={key}
                className="shared-media-item shared-media-tile"
            >
                {source ? (
                    isVideo(file) ? (
                        <video
                            src={source}
                            controls={!isMoreTile}
                            preload="metadata"
                        />
                    ) : (
                        <Image
                            src={source}
                            preview={!isMoreTile}
                            alt={file.name}
                        />
                    )
                ) : (
                    <div className="shared-media-placeholder">
                        <Spin />
                    </div>
                )}

                {isMoreTile && (
                    <div
                        className="shared-media-more-overlay"
                        onClick={() => setShowAllMedia(true)}
                    >
                        +{remainingMedia}
                    </div>
                )}
            </div>
        );
    };

    const renderMedia = () => {
        if (loadingMedia) {
            return (
                <div className="shared-loading">
                    <Spin />
                </div>
            );
        }

        if (!media.length) {
            return <Empty description="No shared media" />;
        }

        return (
            <>
                <div className="shared-media-grid">
                    {visibleMedia.map(renderMediaItem)}
                </div>

                <Modal
                 
                    open={showAllMedia}
                    onCancel={() => setShowAllMedia(false)}
                    footer={null}
                    title="Shared Media"
                    width="100vw"
                    centered={false}
                    closable
                    maskClosable
                    className="shared-media-fullscreen-modal"
                    styles={{
                        // border:"",

                        wrapper: {
                            position: "fixed",
                            inset: 0,
                            overflow: "hidden",
                        },
                        container: {
                            width: "100vw",
                            height: "100dvh",
                            maxHeight: "100dvh",
                            padding: 0,
                            margin: 0,
                            borderRadius: 0,
                            background: "var(--bg-main)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        
                            
                          
                        },
                        header: {
                            flex: "0 0 56px",
                            height: "56px",
                            padding: "16px 24px",
                            margin: 0,
                            background: "var(--bg-main)",
                            borderBottom: "1px solid var(--border-color)",
                        },
                        body: {
                            height: "calc(100dvh - 56px)",
                            maxHeight: "calc(100dvh - 56px)",
                            flex: "1 1 auto",
                            minHeight: 0,
                            padding: "20px",
                            overflowY: "scroll",
                            overflowX: "hidden",
                            background: "var(--bg-main)",

                        },
                    } as any}
                >
                    <div className="shared-media-fullscreen-grid">
                        {media.map((file) => {
                            const source = mediaSources[getFileKey(file)];

                            return (
                                <div
                                    key={getFileKey(file)}
                                    className="shared-media-fullscreen-item"
                                >
                                    {source ? (
                                        isVideo(file) ? (
                                            <video src={source} controls preload="metadata" />
                                        ) : (
                                            <Image src={source} preview alt={file.name} />
                                        )
                                    ) : (
                                        <div className="shared-media-placeholder">
                                            <Spin />
                                        </div>
                                    )}

                                    <span className="shared-media-name">{file.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </Modal>
            </>
        );
    };

    const renderDocuments = () => {
        if (!documents.length) {
            return <Empty description="No shared documents" />;
        }

        return (
            <div className="shared-docs-list">
                {documents.map((file) => (
                    <div
                        key={getFileKey(file)}
                        className="shared-document-item"
                    >
                        <div className="shared-document-icon">
                            {getFileIcon(file)}
                        </div>

                        <div className="shared-document-info">
                            <Text ellipsis title={file.name}>
                                {file.name}
                            </Text>

                            <Text type="secondary" className="shared-document-size">
                                {formatFileSize(file.size)}
                            </Text>
                        </div>

                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => void handleDownload(file)}
                            title="Download"
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderLinks = () => {
        if (!links.length) {
            return <Empty description="No shared links" />;
        }

        return (
            <div className="shared-links-list">
                {links.map((item) => (
                    <div key={item.url} className="shared-link-item">
                        <LinkOutlined />

                        <div className="shared-link-info">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {item.url}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="shared-conversation-content">
            <div className="shared-conversation-heading">
                <h3>Shared</h3>
            </div>

            <Tabs
                items={[
                    {
                        key: "media",
                        label: `Media${media.length ? ` (${media.length})` : ""}`,
                        children: renderMedia(),
                    },
                    {
                        key: "docs",
                        label: `Docs${documents.length ? ` (${documents.length})` : ""}`,
                        children: renderDocuments(),
                    },
                    {
                        key: "links",
                        label: `Links${links.length ? ` (${links.length})` : ""}`,
                        children: renderLinks(),
                    },
                ]}
            />
        </div>
    );
}
