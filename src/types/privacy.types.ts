export type Visibility =
  | "everyone"
  | "contacts"
  | "contacts_except"
  | "nobody";

export interface PrivacySettings {
  lastSeen: Visibility;
  online: "everyone" | "same_as_last_seen";
  profilePhoto: Visibility;
  about: Visibility;
  status: "contacts" | "contacts_except" | "only_share";
  readReceipts: boolean;
  groups: Visibility;
  blockedContacts: string[];
}

export const DEFAULT_SETTINGS: PrivacySettings = {
  lastSeen: "contacts",
  online: "same_as_last_seen",
  profilePhoto: "everyone",
  about: "everyone",
  status: "contacts",
  readReceipts: true,
  groups: "contacts",
  blockedContacts: [],
};

export const STORAGE_KEY = "pchat_privacy_settings";

export const visibilityOptions = [
  { label: "Everyone", value: "everyone" },
  { label: "My contacts", value: "contacts" },
  { label: "My contacts except...", value: "contacts_except" },
  { label: "Nobody", value: "nobody" },
];

export const groupOptions = [
  { label: "Everyone", value: "everyone" },
  { label: "My contacts", value: "contacts" },
  { label: "My contacts except...", value: "contacts_except" },
];

export const statusOptions = [
  { label: "My contacts", value: "contacts" },
  { label: "My contacts except...", value: "contacts_except" },
  { label: "Only share with...", value: "only_share" },
];
