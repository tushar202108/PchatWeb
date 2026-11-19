
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Button,
    Card,
    Divider,
    Empty,
    Input,
    Radio,
    Select,
    Space,
    Switch,
    Typography,
    message,
} from "antd";
import { chatService } from "../services/chatService";
import { Link } from "react-router-dom";
import {
    ArrowLeftOutlined,
    LockOutlined,
    EyeOutlined,
    CameraOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    CheckOutlined,
    TeamOutlined,
    UserOutlined,
    PlusOutlined,
    DeleteOutlined,
    SafetyOutlined,
    MessageOutlined,
} from "@ant-design/icons";

import "../index.css";

const { Title, Text } = Typography;

type Visibility =
    | "everyone"
    | "my-contacts"
    | "my-contacts-except"
    | "nobody";

type OnlineVisibility = "everyone" | "same-as-last-seen";

interface PrivacySettings {
    lastSeen: Visibility;
    online: OnlineVisibility;
    profilePhoto: Visibility;
    about: Visibility;
    status: Visibility;
    readReceipts: boolean;
    groups: Visibility;
}

const DEFAULT_SETTINGS: PrivacySettings = {
    lastSeen: "my-contacts",
    online: "same-as-last-seen",
    profilePhoto: "my-contacts",
    about: "everyone",
    status: "my-contacts",
    readReceipts: true,
    groups: "my-contacts",
};

const STORAGE_KEY = "pchat_privacy_settings";
const BLOCKED_STORAGE_KEY = "pchat_blocked_contacts";

const visibilityOptions = [
    { label: "Everyone", value: "everyone" },
    { label: "My contacts", value: "my-contacts" },
    { label: "Nobody", value: "nobody" },
];

interface PrivacyCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}

function PrivacyCard({
    icon,
    title,
    description,
    children,
}: PrivacyCardProps) {
    return (
        <Card className="privacy-card" bordered>
            <div className="privacy-card-heading">
                <span className="privacy-card-icon">{icon}</span>

                <div className="privacy-card-title">
                    <Text strong>{title}</Text>
                    <Text type="secondary">{description}</Text>
                </div>
            </div>

            <Divider />

            {children}
        </Card>
    );
}

interface VisibilitySettingProps {
    title: string;
    description: string;
    value: Visibility;
    onChange: (value: Visibility) => void;
    includeNobody?: boolean;
}

function VisibilitySetting({
    title,
    description,
    value,
    onChange,
    includeNobody = true,
}: VisibilitySettingProps) {
    const options = includeNobody
        ? visibilityOptions
        : visibilityOptions.filter(
            (option) => option.value !== "nobody"
        );

    return (
        <div className="privacy-setting">
            <div className="privacy-setting-info">
                <Text strong>{title}</Text>
                <Text type="secondary">{description}</Text>
            </div>

            <Radio.Group
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="privacy-radio-group"
            >
                {options.map((option) => (
                    <Radio key={option.value} value={option.value}>
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>
        </div>
    );
}

export default function PrivacyPage() {
    const navigate = useNavigate();

    const [settings, setSettings] =
        useState<PrivacySettings>(DEFAULT_SETTINGS);

    const [blockedContacts, setBlockedContacts] =
        useState<string[]>([]);

    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedBlockedContact, setSelectedBlockedContact] =
        useState<string | undefined>();

    const [messageApi, contextHolder] = message.useMessage();

    // Load privacy settings and blocked contacts.
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEY);
            const savedBlocked = localStorage.getItem(BLOCKED_STORAGE_KEY);

            if (savedSettings) {
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...JSON.parse(savedSettings),
                });
            }

            if (savedBlocked) {
                const parsed = JSON.parse(savedBlocked);

                if (Array.isArray(parsed)) {
                    setBlockedContacts(parsed);
                }
            }
        } catch (error) {
            console.error("Unable to load privacy settings:", error);
        }
    }, []);

    // Save settings whenever they change.
    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
        );
    }, [settings]);

    useEffect(() => {
        const loadContacts = async (userId: "0") => {
            try {
                const data = await chatService.getContacts(userId);

                setContacts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load contacts:", error);
                messageApi.error("Unable to load contacts");
            }
        };

        loadContacts('0');
    }, [messageApi]);

    // Save blocked contacts whenever the list changes.
    useEffect(() => {
        localStorage.setItem(
            BLOCKED_STORAGE_KEY,
            JSON.stringify(blockedContacts)
        );
    }, [blockedContacts]);

    const updateSetting = <K extends keyof PrivacySettings>(
        key: K,
        value: PrivacySettings[K]
    ) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const addBlockedContact = () => {
        const contact = selectedBlockedContact?.trim().toLowerCase();

        if (!contact) {
            messageApi.warning("Please select a contact.");
            return;
        }

        if (blockedContacts.includes(contact)) {
            messageApi.warning("This contact is already blocked.");
            return;
        }

        setBlockedContacts((previous) => [...previous, contact]);
        setSelectedBlockedContact(undefined);

        messageApi.success("Contact added to blocked list.");
    };

    const removeBlockedContact = (contact: string) => {
        setBlockedContacts((previous) =>
            previous.filter((item) => item !== contact)
        );

        messageApi.success("Contact removed from blocked list.");
    };

    return (
        <div className="privacy-page">
            {contextHolder}

            {/* Header */}
            <div className="privacy-page-header">
                <Link
                    to="/chat"
                    replace
                    className="privacy-back-button"
                    aria-label="Back to chats"
                    title="Back to chats"
                >
                    <ArrowLeftOutlined />
                </Link>

                <div className="privacy-header-info">
                    <Title level={3}>Privacy</Title>
                    <Text type="secondary">
                        Manage your privacy and control what others can see.
                    </Text>
                </div>
            </div>

            {/* Privacy settings */}
            <div className="privacy-page-content">

                {/* Last seen and online */}
                <PrivacyCard
                    icon={<ClockCircleOutlined />}
                    title="Last seen and online"
                    description="Control who can see when you were last active and when you are online."
                >
                    <VisibilitySetting
                        title="Who can see my last seen"
                        description="Choose who can see your last active time."
                        value={settings.lastSeen}
                        onChange={(value) => updateSetting("lastSeen", value)}
                    />

                    <Divider />

                    <div className="privacy-setting">
                        <div className="privacy-setting-info">
                            <Text strong>Who can see when I'm online</Text>
                            <Text type="secondary">
                                Choose who can see your online presence.
                            </Text>
                        </div>

                        <Radio.Group
                            value={settings.online}
                            onChange={(event) =>
                                updateSetting("online", event.target.value)
                            }
                            className="privacy-radio-group"
                        >
                            <Radio value="everyone">Everyone</Radio>
                            <Radio value="same-as-last-seen">
                                Same as last seen
                            </Radio>
                        </Radio.Group>
                    </div>
                </PrivacyCard>

                {/* Profile information */}
                <PrivacyCard
                    icon={<UserOutlined />}
                    title="Profile information"
                    description="Choose who can view your personal information."
                >
                    <VisibilitySetting
                        title="Profile photo"
                        description="Who can see your profile picture?"
                        value={settings.profilePhoto}
                        onChange={(value) =>
                            updateSetting("profilePhoto", value)
                        }
                    />

                    <Divider />

                    <VisibilitySetting
                        title="About"
                        description="Who can see your profile information?"
                        value={settings.about}
                        onChange={(value) =>
                            updateSetting("about", value)
                        }
                    />
                </PrivacyCard>

                {/* Status privacy */}
                {/* <PrivacyCard
                    icon={<EyeOutlined />}
                    title="Status"
                    description="Control who can view your status updates."
                >
                    <VisibilitySetting
                        title="Who can see my status updates"
                        description="Choose your audience for status updates."
                        value={settings.status}
                        onChange={(value) =>
                            updateSetting("status", value)
                        }
                    />
                </PrivacyCard> */}

                {/* Read receipts */}
                <PrivacyCard
                    icon={<CheckOutlined />}
                    title="Read receipts"
                    description="Control whether read acknowledgements are shared."
                >
                    <div className="privacy-switch-row">
                        <div className="privacy-setting-info">
                            <Text strong>Read receipts</Text>
                            <Text type="secondary">
                                If disabled, you won't send read receipts or see
                                read receipts from other users.
                            </Text>
                        </div>

                        <Switch
                            checked={settings.readReceipts}
                            onChange={(checked) =>
                                updateSetting("readReceipts", checked)
                            }
                        />
                    </div>
                </PrivacyCard>

                {/* Groups */}
                {/* <PrivacyCard
                    icon={<TeamOutlined />}
                    title="Groups"
                    description="Choose who can add you to groups."
                >
                    <VisibilitySetting
                        title="Who can add me to groups"
                        description="Control who can add you to group conversations."
                        value={settings.groups}
                        onChange={(value) =>
                            updateSetting("groups", value)
                        }
                        includeNobody={false}
                    />
                </PrivacyCard> */}

                {/* Blocked contacts */}
                <PrivacyCard
                    icon={<SafetyOutlined />}
                    title="Blocked contacts"
                    description="Manage contacts you have blocked."
                >
                    <div className="blocked-contact-input">
                        <Select
                            showSearch
                            allowClear
                            value={selectedBlockedContact}
                            onChange={setSelectedBlockedContact}
                            placeholder="Search or select a contact"
                            optionFilterProp="label"
                            style={{ flex: 1, minWidth: 0 }}
                            options={contacts
                                .filter((contact) => contact.email)
                                .map((contact) => ({
                                    label: `${contact.username || contact.email} (${contact.email})`,
                                    value: String(contact.email).toLowerCase(),
                                }))}
                        />

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addBlockedContact}
                        >
                            Block
                        </Button>
                    </div>

                    <Divider />

                    {blockedContacts.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No blocked contacts"
                        />
                    ) : (
                        <div className="blocked-contact-list">
                            {blockedContacts.map((contact) => (
                                <div
                                    className="blocked-contact-item"
                                    key={contact}
                                >
                                    <Space>
                                        <Avatar icon={<UserOutlined />} />
                                        <div className="blocked-contact-info">
                                            <Text strong>{contact}</Text>
                                            <Text type="secondary">
                                                Blocked contact
                                            </Text>
                                        </div>
                                    </Space>

                                    <Button
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        title="Unblock contact"
                                        onClick={() =>
                                            removeBlockedContact(contact)
                                        }
                                    >
                                        Unblock
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </PrivacyCard>

                {/* Footer */}
                <div className="privacy-footer">
                    <LockOutlined />
                    <Text type="secondary">
                        Your privacy settings are stored on this device.
                    </Text>
                </div>
            </div>
        </div>
    );
}
