
export type WallpaperSource = "default" | "custom";

export interface WallpaperFile {
  id: string;
  name: string;
  source: WallpaperSource;
}

export interface WallpaperSettings {
  applyToAll: boolean;
  all: string;
  conversations: Record<string, string>;
}

export interface WallpaperCollection {
  defaults: WallpaperFile[];
  custom: WallpaperFile[];
}

export interface WallpaperStorageAPI {
  getAll: () => Promise<WallpaperCollection>;

  getSettings: () => Promise<WallpaperSettings>;

  saveSettings: (
    settings: WallpaperSettings
  ) => Promise<boolean>;

  read: (id: string) => Promise<string>;

  import: (payload: {
    name: string;
    bytes: Uint8Array;
  }) => Promise<WallpaperFile>;

  delete: (id: string) => Promise<boolean>;
}
