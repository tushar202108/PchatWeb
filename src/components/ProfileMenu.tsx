import { useState } from "react";
import type { ReactNode } from "react";
import { Popover, Typography } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  MoonOutlined,
  LockOutlined,
  LogoutOutlined,
  RightOutlined,
  CheckOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export type ProfileStatus = "available" | "away" | "dnd";
export type ProfileMenuAction = "profile" | "settings" | "privacy" | "logout";

const STATUS_OPTIONS: { key: ProfileStatus; label: string }[] = [
  { key: "available", label: "Available" },
  { key: "away", label: "Away" },
  { key: "dnd", label: "Do not disturb" },
];

interface ProfileMenuProps {
  name: string;
  email?: string;
  status: ProfileStatus;
  onStatusChange: (status: ProfileStatus) => void;
  onAction: (action: ProfileMenuAction) => void;
  /** The element that opens the menu (your existing <Avatar />). */
  children: ReactNode;
}

export default function ProfileMenu({
  name,
  email,
  status,
  onStatusChange,
  onAction,
  children,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const currentStatus = STATUS_OPTIONS.find((option) => option.key === status);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStatusOpen(false);
  };

  const runAction = (action: ProfileMenuAction) => {
    setOpen(false);
    setStatusOpen(false);
    onAction(action);
    
  };

  const content = (
    <div className="profile-menu" role="menu">
      <div className="profile-menu-head">
        <Text className="profile-menu-name">{name}</Text>
        {email && email !== name && (
          <Text className="profile-menu-email">{email}</Text>
        )}
      </div>

      <div className="profile-menu-divider" />

      <button
        type="button"
        role="menuitem"
        className="profile-menu-item"
        onClick={() => runAction("profile")}
      >
        <UserOutlined className="profile-menu-icon" />
        <span className="profile-menu-label">Profile</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="profile-menu-item"
        aria-expanded={statusOpen}
        onClick={() => setStatusOpen((current) => !current)}
      >
        <MoonOutlined className="profile-menu-icon" />
        <span className="profile-menu-label">Status</span>
        <span className="profile-menu-value">
          <span className={`profile-status-dot ${status}`} />
          {currentStatus?.label}
        </span>
        <RightOutlined
          className={`profile-menu-chevron ${statusOpen ? "open" : ""}`}
        />
      </button>

      {statusOpen && (
        <div className="profile-status-list">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitemradio"
              aria-checked={status === option.key}
              className="profile-status-option"
              onClick={() => {
                onStatusChange(option.key);
                setStatusOpen(false);
              }}
            >
              <span className={`profile-status-dot ${option.key}`} />
              <span className="profile-menu-label">{option.label}</span>
              {status === option.key && (
                <CheckOutlined className="profile-status-check" />
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        role="menuitem"
        className="profile-menu-item"
        onClick={() => runAction("settings")}
      >
        <SettingOutlined className="profile-menu-icon" />
        <span className="profile-menu-label">Settings</span>
      </button>

      <button
        type="button"
        role="menuitem"
        className="profile-menu-item"
        onClick={() => runAction("privacy")}
      >
        <LockOutlined className="profile-menu-icon" />
        <span className="profile-menu-label">Privacy</span>
      </button>

      <div className="profile-menu-divider" />

      <button
        type="button"
        role="menuitem"
        className="profile-menu-item danger"
        onClick={() => runAction("logout")}
      >
        <LogoutOutlined className="profile-menu-icon" />
        <span className="profile-menu-label">Log out</span>
      </button>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="rightTop"
      arrow={false}
      content={content}
      rootClassName="profile-menu-popover"
    >
      <button
        type="button"
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
      >
        {children}
      </button>
    </Popover>
  );
}