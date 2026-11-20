import type { WallpaperStorageAPI } from "./wallpaper.types";
export { };

declare global {
  interface LocalAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    storageKey: string;
  }

  interface Window {
    chatStorage: {
      saveConversations: (
        userId: string,
        conversations: any[]
      ) => Promise<boolean>;

      getConversations: (userId: string) => Promise<any[]>;

      saveMessages: (
        userId: string,
        messages: any[]
      ) => Promise<boolean>;

      getMessages: (
        userId: string,
        conversationId: string
      ) => Promise<any[]>;

      getAllMessages: (userId: string) => Promise<any[]>;

      deleteConversation: (
        userId: string,
        conversationId: string
      ) => Promise<boolean>;

      deleteMessage: (
        userId: string,
        conversationId: string,
        messageId: string
      ) => Promise<boolean>;

      saveAttachment: (payload: {
        userId: string;
        conversationId: string;
        name: string;
        type: string;
        bytes: Uint8Array;
      }) => Promise<LocalAttachment>;

      getAttachment: (
        storageKey: string
      ) => Promise<string>;

      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
     wallpaperStorage: WallpaperStorageAPI;
  }
}
