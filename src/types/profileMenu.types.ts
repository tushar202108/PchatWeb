import type { ReactNode } from "react";

export type ProfileStatus = "available" | "away" | "dnd";

export type ProfileMenuAction =
  | "profile"
  | "settings"
  | "privacy"
  | "logout"
  | "themeSelector";

export const STATUS_OPTIONS: {
  key: ProfileStatus;
  label: string;
}[] = [
    { key: "available", label: "Available" },
    { key: "away", label: "Away" },
    { key: "dnd", label: "Do not disturb" },
  ];

export interface ProfileMenuProps {
  name: string;
  email?: string;
  status: ProfileStatus;
  onStatusChange: (status: ProfileStatus) => void;
  onAction: (action: ProfileMenuAction) => void;
  children: ReactNode;
  userId: string;
}