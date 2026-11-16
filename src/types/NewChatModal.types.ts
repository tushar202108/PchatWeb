export interface NewChatContact {
  id: string;
  name: string;
  subtitle?: string;
  online?: boolean;
  username?: string;
}

export interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contact: NewChatContact) => void;
  onContactsLoaded: (contacts: NewChatContact[]) => void;
}

export const AVATAR_TONES = [
  "#d4b896",
  "#8fa090",
  "#c49a96",
  "#96a3b3",
  "#a89aae",
  "#bfa26e",
];
