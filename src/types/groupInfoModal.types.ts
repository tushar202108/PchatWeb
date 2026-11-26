import type { ChatMessage, Conversation } from "./chats.type";

export interface GroupMember {
    id: string;
    userId: string;
    role: string;
    status: string;
    joinedAt?: string;
    leftAt?: string | null;
    chatGroup?: {
        groupId: string;
        groupName: string;
        groupDescription: string;
        groupImage: string;
        createdAt: string;
        active: boolean;
        createdBy?: {
            id: number;
            username: string;
            email: string;
        };
    };
}

export interface Contact {
    id: string;
    name: string;
    email?: string;
}

export interface Props {
    open: boolean;
    group: Conversation | null;
    messages: ChatMessage[];
    currentUserId: string;
    onClose: () => void;
    contacts?: Contact[];
    onClearChat?: (groupId: string) => Promise<void> | void;
    onLeaveGroup?: (groupId: string, payload: { userDetails: { userId: string; mail: string; name: string; }; }) => Promise<void>;
    onGroupWallpaperChange?: (url: string) => void;
    onChangeGroupImage?: (
        groupId: string,
        file: File
    ) => Promise<string | void>;

    onDeleteGroup?: (groupId: string) => Promise<void>;
}