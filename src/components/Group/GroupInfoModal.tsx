
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Avatar,
    Button,
    Divider,
    Modal,
    Spin,
    Typography,
    message as antdMessage,
} from "antd";

import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    LogoutOutlined,
    PictureOutlined,
} from "@ant-design/icons";

import type { Conversation, ChatMessage } from "../../types/chats.type";
import { groupService } from "../../services/groupServices";
import GroupMembersList from "./GroupMembersList";
import GroupSharedMedia from "./GroupSharedMedia";
import "./GroupInfoModal.css";
import ConversationWallpaperPicker from "../../components/chat/ConversationWallpaperPicker";
import type { GroupMember, Props } from "../../types/groupInfoModal.types";
const { Text, Title } = Typography;



export default function GroupInfoModal({
    open,
    group,
    messages,
    currentUserId,
    onClose,
    contacts = [],
    onClearChat,
    onLeaveGroup,
    onChangeGroupImage,
    onDeleteGroup, onGroupWallpaperChange,
}: Props) {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState<"media" | "members">("members");
    const [wallpaperOpen, setWallpaperOpen] = useState(false);
    const [groupDetails, setGroupDetails] = useState({
        name: group?.name ?? "",
        description: group?.groupDescription ?? "",
        image: group?.groupImage ?? "",
    });

    const groupId =
        (group as (Conversation & { groupId?: string }) | null)?.groupId ??
        group?.id ??
        "";

    const loadMembers = useCallback(async () => {
        if (!groupId) return;

        try {
            setLoading(true);

            const response = await groupService.getGroupMembers(groupId);

            const result: GroupMember[] = Array.isArray(response)
                ? response
                : Array.isArray(response?.members)
                    ? response.members
                    : Array.isArray(response?.data)
                        ? response.data
                        : Array.isArray(response?.data?.members)
                            ? response.data.members
                            : [];

            const activeMembers = result.filter(
                (member) => member.status === "ACTIVE"
            );

            setMembers(activeMembers);

            // Your API returns group details inside chatGroup.
            const apiGroup = activeMembers.find(
                (member) => member.chatGroup
            )?.chatGroup;

            if (apiGroup) {
                setGroupDetails({
                    name: apiGroup.groupName || group?.name || "",
                    description:
                        apiGroup.groupDescription ??
                        group?.groupDescription ??
                        "",
                    image: apiGroup.groupImage ?? group?.groupImage ?? "",
                });
            }
        } catch (error) {
            console.error("Failed to load group members:", error);
            antdMessage.error("Unable to load group members");
        } finally {
            setLoading(false);
        }
    }, [
        groupId,
        group?.name,
        group?.groupDescription,
        group?.groupImage,
    ]);

    useEffect(() => {
        if (!open || !group) return;

        setGroupDetails({
            name: group.name,
            description: group.groupDescription ?? "",
            image: group.groupImage ?? "",
        });

        setActiveTab("media");
        void loadMembers();
    }, [open, group?.id, loadMembers]);

    const isAdmin = useMemo(
        () =>
            members.some(
                (member) =>
                    String(member.userId) === String(currentUserId) &&
                    member.role?.toUpperCase() === "ADMIN" &&
                    member.status === "ACTIVE"
            ),
        [members, currentUserId]
    );

    const handleAddMembers = async (memberIds: string[]) => {
        if (!groupId) return;

        try {
            await groupService.addGroupMembers(groupId, { memberIds });
            antdMessage.success("Members added successfully");
            await loadMembers();
        } catch (error) {
            console.error("Failed to add group members:", error);
            antdMessage.error("Unable to add members");
            throw error;
        }
    };

    const handleImageSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        // Allow selecting the same file again later.
        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            antdMessage.warning("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            antdMessage.warning("Group photo must be smaller than 5 MB");
            return;
        }

        if (!onChangeGroupImage) {
            antdMessage.info(
                "Connect the group image update API to enable uploading"
            );
            return;
        }

        try {
            setUploadingImage(true);

            const updatedImage = await onChangeGroupImage(groupId, file);

            if (updatedImage) {
                setGroupDetails((current) => ({
                    ...current,
                    image: updatedImage,
                }));
            }

            await loadMembers();
            antdMessage.success("Group photo updated");
        } catch (error) {
            console.error("Failed to update group photo:", error);
            antdMessage.error("Unable to update group photo");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleClearChat = () => {
        if (!groupId) return;

        Modal.confirm({
            title: "Clear group chat?",
            content: "All locally stored messages in this group will be cleared.",
            okText: "Clear chat",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                await onClearChat?.(groupId);
                antdMessage.success("Group chat cleared");
            },
        });
    };

    const handleLeaveGroup = () => {
        if (!groupId) return;

        const currentContact = contacts.find(
            (contact) =>
                String(contact.id) === String(currentUserId)
        );

        const currentMember = members.find(
            (member) =>
                String(member.userId) === String(currentUserId)
        );

        const creator = currentMember?.chatGroup?.createdBy;

        const payload = {
            userDetails: {
                userId: String(currentUserId),
                mail:
                    currentContact?.email ||
                    (creator && String(creator.id) === String(currentUserId)
                        ? creator.email
                        : ""),
                name:
                    currentContact?.name ||
                    (creator && String(creator.id) === String(currentUserId)
                        ? creator.username
                        : "") ||
                    `User ${currentUserId}`,
            },
        };

        Modal.confirm({
            title: "Leave and delete this group?",
            content:
                "You will leave this group and its chat will be deleted from this device.",
            okText: "Leave and delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await onLeaveGroup?.(groupId, payload);
                    antdMessage.success("You left the group");
                    onClose();
                } catch (error) {
                    console.error("Failed to leave group:", error);
                    antdMessage.error("Unable to leave group");
                    throw error;
                }
            },
        });
    };

    const handleDeleteGroup = () => {
        if (!groupId || !onDeleteGroup) {
            antdMessage.info("Connect the delete group API to enable this action");
            return;
        }

        Modal.confirm({
            title: "Delete group?",
            content: `Are you sure you want to delete "${groupDetails.name}"? This action may affect all group members.`,
            okText: "Delete group",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                await onDeleteGroup(groupId);
                antdMessage.success("Group deleted");
                onClose();
            },
        });
    };

    if (!group) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={650}
            centered
            destroyOnHidden
            className="group-info-modal"
            styles={{
                container: {
                    background: "transparent"
                }
            } as any}
        >
            <div className="group-info-container">
                <div className="group-info-top">
                    <div className="group-info-profile">
                        <Spin spinning={uploadingImage}>
                            <Avatar
                                size={105}
                                src={groupDetails.image || undefined}
                                icon={<UserOutlined />}
                                className="group-info-avatar"
                            />
                        </Spin>

                        <Title level={4} className="group-info-title">
                            {groupDetails.name}
                        </Title>

                        <Text type="secondary">
                            {members.length} participants
                        </Text>

                        {isAdmin && (
                            <>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleImageSelect}
                                />

                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    loading={uploadingImage}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    Change group photo
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <Divider />

                <div className="group-info-description">
                    <Text type="secondary">Group description</Text>
                    <p>
                        {groupDetails.description.trim() ||
                            "No description added"}
                    </p>
                </div>

                <Divider />

                <div className="group-info-section-header">
                    <Title level={5}>Group information</Title>
                    <Text type="secondary">{members.length} members</Text>
                </div>

                <div className="group-info-tabs">
                    <button
                        className={activeTab === "members" ? "active" : ""}
                        onClick={() => setActiveTab("members")}
                    >
                        Members
                    </button>

                    <button
                        className={activeTab === "media" ? "active" : ""}
                        onClick={() => setActiveTab("media")}
                    >
                        Media, links and documents
                    </button>
                </div>

                {activeTab === "members" ? (
                    <Spin spinning={loading}>
                        <GroupMembersList
                            groupId={groupId}
                            members={members}
                            contacts={contacts}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onAddMembers={handleAddMembers}
                            onRefresh={loadMembers}
                        />
                    </Spin>
                ) : (
                    <GroupSharedMedia messages={messages} />
                )}

                <Divider />

                <div className="group-info-actions">
                    <Button
                        block
                        icon={<PictureOutlined />}
                        onClick={() => setWallpaperOpen(true)}
                    >
                        Group wallpaper
                    </Button>

                    <Button
                        block
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleClearChat}
                    >
                        Clear chat
                    </Button>

                    {isAdmin && (
                        <Button
                            block
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteGroup}
                        >
                            Delete group
                        </Button>
                    )}

                    <Button
                        block
                        danger
                        icon={<LogoutOutlined />}
                        onClick={handleLeaveGroup}
                    >
                        Leave group
                    </Button>
                </div>
            </div>
            <Modal
                title="Group wallpaper"
                open={wallpaperOpen}
                onCancel={() => setWallpaperOpen(false)}
                footer={null}
                width={650}
                destroyOnHidden
            >
                <ConversationWallpaperPicker
                    conversationId={group.id}
                    scope="group"
                    onWallpaperChange={(url) => {
                        onGroupWallpaperChange?.(url);
                    }}
                />
            </Modal>
        </Modal>
    );
}
