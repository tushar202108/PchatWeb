
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Empty, Spin, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";

import type {
    WallpaperFile,
    WallpaperSettings,
} from "../../types/wallpaper.types";

import "./ConversationWallpaperPicker.css";

interface Props {
    conversationId: string;
    onWallpaperChange: (url: string) => void;
    scope?: "conversation" | "group";
}

export default function ConversationWallpaperPicker({
    conversationId,
    onWallpaperChange,
    scope = "conversation",
}: Props) {
    const [wallpapers, setWallpapers] = useState<WallpaperFile[]>([]);

    const [settings, setSettings] = useState<WallpaperSettings>({
        applyToAll: true,
        all: "",
        conversations: {},
    });

    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadWallpaper = async (id: string) => {
        if (!id) {
            onWallpaperChange("");
            return;
        }

        try {
            const url = await window.wallpaperStorage.read(id);
            onWallpaperChange(url);
        } catch (error) {
            console.error("Unable to load wallpaper:", error);
            onWallpaperChange("");
        }
    };

    const getAllWallpapers = async (): Promise<WallpaperFile[]> => {
        const result = await window.wallpaperStorage.getAll();
        if (Array.isArray(result)) {
            return result;
        }
        return [
            ...(result?.defaults ?? []),
            ...(result?.custom ?? []),
        ];
    };


    useEffect(() => {
        let active = true;

        const initialize = async () => {
            setLoading(true);

            try {
                const [allWallpapers, savedSettings] = await Promise.all([
                    getAllWallpapers(),
                    window.wallpaperStorage.getSettings(),
                ]);

                if (!active) return;

                setWallpapers(allWallpapers);
                setSettings(savedSettings);

                const conversationWallpaper =
                    savedSettings.conversations[conversationId];

                const initialId =
                    scope === "group"
                        ? conversationWallpaper
                        : savedSettings.applyToAll
                            ? savedSettings.all
                            : conversationWallpaper || savedSettings.all;

                const fallbackId = allWallpapers.some(
                    (file) => file.id === initialId
                )
                    ? initialId
                    : allWallpapers.find(
                        (file) => file.source === "default"
                    )?.id ?? allWallpapers[0]?.id ?? "";

                setSelectedId(fallbackId);

                if (fallbackId) {
                    const url = await window.wallpaperStorage.read(fallbackId);

                    if (active) {
                        onWallpaperChange(url);
                    }
                } else if (active) {
                    onWallpaperChange("");
                }
            } catch (error) {
                console.error("Failed to initialize wallpapers:", error);
                message.error("Unable to load wallpapers");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void initialize();

        return () => {
            active = false;
        };
    }, [conversationId]);
    const saveSelection = async (
        id: string,
        currentSettings: WallpaperSettings = settings
    ) => {
        const nextSettings: WallpaperSettings = {
            ...currentSettings,

            all:
                scope === "conversation" && currentSettings.applyToAll
                    ? id
                    : currentSettings.all,

            conversations: {
                ...currentSettings.conversations,
                [conversationId]: id,
            },
        };;

        await window.wallpaperStorage.saveSettings(nextSettings);

        setSettings(nextSettings);
        setSelectedId(id);

        await loadWallpaper(id);
    };
    const handleSelect = async (id: string) => {
        try {
            await saveSelection(id);
        } catch (error) {
            console.error("Failed to save wallpaper selection:", error);
            message.error("Unable to save wallpaper selection");
        }
    };

    const handleImport = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            message.error("Please select an image file");
            event.target.value = "";
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            message.error("Wallpaper must be smaller than 15 MB");
            event.target.value = "";
            return;
        }

        setBusy(true);

        try {
            const imported = await window.wallpaperStorage.import({
                name: file.name,
                bytes: new Uint8Array(await file.arrayBuffer()),
            });

            const updatedFiles = await getAllWallpapers();

            setWallpapers(updatedFiles);

            await saveSelection(imported.id);

            message.success("Custom wallpaper added");
        } catch (error) {
            console.error("Wallpaper import failed:", error);
            message.error("Unable to import wallpaper");
        } finally {
            setBusy(false);
            event.target.value = "";
        }
    };
    const handleDelete = async (id: string) => {
        try {
            const wallpaper = wallpapers.find(
                (item) => item.id === id
            );

            if (!wallpaper || wallpaper.source !== "custom") {
                return;
            }

            await window.wallpaperStorage.delete(id);

            const updatedFiles = await getAllWallpapers();

            setWallpapers(updatedFiles);

            if (selectedId === id) {
                const fallback =
                    updatedFiles.find(
                        (file) => file.source === "default"
                    ) ?? updatedFiles[0];

                if (fallback) {
                    await saveSelection(fallback.id);
                } else {
                    setSelectedId("");
                    await loadWallpaper("");
                }
            }

            message.success("Custom wallpaper deleted");
        } catch (error) {
            console.error("Wallpaper deletion failed:", error);
            message.error("Unable to delete wallpaper");
        }
    };
    const wallpaperPages = useMemo(() => {
        const pages: WallpaperFile[][] = [];

        for (let i = 0; i < wallpapers.length; i += 6) {
            pages.push(wallpapers.slice(i, i + 6));
        }

        return pages;
    }, [wallpapers]);

    if (loading) {
        return <Spin />;
    }
    return (
        <section className="conversation-wallpaper">


            <div className="conversation-wallpaper-heading">
                <h4>Chat wallpaper</h4>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImport}
                    hidden
                />

                <Button
                    size="small"
                    icon={<UploadOutlined />}
                    loading={busy}
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                >
                    Add custom
                </Button>
            </div>


            <div className="wallpaper-grid">
                {wallpaperPages.map((page, pageIndex) => (
                    <div className="wallpaper-page" key={pageIndex}>
                        {page.map((wallpaper) => (
                            <div
                                key={wallpaper.id}
                                className={`wallpaper-item ${selectedId === wallpaper.id ? "selected" : ""
                                    }`}
                            >
                                <button
                                    type="button"
                                    className="wallpaper-image-button"
                                    onClick={() => void handleSelect(wallpaper.id)}
                                    aria-label={`Select ${wallpaper.name}`}
                                >
                                    <WallpaperThumbnail wallpaper={wallpaper} />
                                </button>

                                <span title={wallpaper.name}>
                                    {wallpaper.name}
                                </span>

                                {wallpaper.source === "custom" && (
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => void handleDelete(wallpaper.id)}
                                        aria-label={`Delete ${wallpaper.name}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>


            {wallpapers.length === 0 && (
                <Empty description="No wallpapers available" />
            )}
        </section>
    );
}

// --------------------------------------------------
// WALLPAPER THUMBNAIL
// --------------------------------------------------

function WallpaperThumbnail({
    wallpaper,
}: {
    wallpaper: WallpaperFile;
}) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        let active = true;

        window.wallpaperStorage
            .read(wallpaper.id)
            .then((result) => {
                if (active) {
                    setUrl(result);
                }
            })
            .catch((error) => {
                console.error("Wallpaper thumbnail failed:", error);
            });

        return () => {
            active = false;
        };
    }, [wallpaper.id]);

    return url ? (
        <img
            src={url}
            alt={wallpaper.name}
        />
    ) : (
        <span>Loading...</span>
    );
}
