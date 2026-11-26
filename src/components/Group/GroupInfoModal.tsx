
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
    Form,
    Input,
} from "antd";

import {
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    LogoutOutlined,
    PictureOutlined,
} from "@ant-design/icons";

import type { Conversation } from "../../types/chats.type";
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
    onDeleteGroup, onGroupWallpaperChange,onGroupDetailsUpdated
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
    const [editDetailsOpen, setEditDetailsOpen] = useState(false);
    const [updatingDetails, setUpdatingDetails] = useState(false);
    const [selectedGroupImage, setSelectedGroupImage] = useState<File | null>(null);
    const [previewGroupImage, setPreviewGroupImage] = useState("");

    const [editForm] = Form.useForm();
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

        setActiveTab("members");
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

        try {
            setUploadingImage(true);

            const updatedImage = await onChangeGroupImage?.(groupId, file);

            if (updatedImage) {
                setGroupDetails((current) => ({
                    ...current,
                    image: updatedImage,
                }));
            }

            await loadMembers();

            antdMessage.success("Group photo updated successfully");
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
  const handleUpdateGroupDetails = async (values: {
    groupName: string;
    groupDescription: string;
}) => {
    if (!groupId || !group?.id) return;

    const formData = new FormData();

    const updatedName = values.groupName.trim();
    const updatedDescription = values.groupDescription.trim();

    const updatedDetails: {
        name?: string;
        groupDescription?: string;
        groupImage?: string;
    } = {};

    // Only append changed fields
    if (updatedName !== groupDetails.name) {
        formData.append("groupName", updatedName);
        updatedDetails.name = updatedName;
    }

    if (updatedDescription !== groupDetails.description) {
        formData.append("groupDescription", updatedDescription);
        updatedDetails.groupDescription = updatedDescription;
    }

    if (selectedGroupImage instanceof File) {
        formData.append(
            "groupImage",
            selectedGroupImage,
            selectedGroupImage.name
        );
    }

    if ([...formData.keys()].length === 0) {
        antdMessage.info("No changes to update");
        return;
    }

    try {
        setUpdatingDetails(true);

        const response = await groupService.updateGroupDetails(
            groupId,
            formData
        );

        console.log("Update response:", response);

        const updatedImage =
            response?.groupImage ??
            response?.data?.groupImage ??
            "";

        if (updatedImage) {
            updatedDetails.groupImage = updatedImage;
        }

        // Update GroupInfoModal immediately
        setGroupDetails((current) => ({
            ...current,
            name: updatedName,
            description: updatedDescription,
            image: updatedImage || (
                selectedGroupImage
                    ? previewGroupImage
                    : current.image
            ),
        }));

        // Notify ChatPage to update Sidebar and Header.
        // Use local conversation ID, not backend groupId.
        onGroupDetailsUpdated?.(group.id, updatedDetails);

        setEditDetailsOpen(false);
        setSelectedGroupImage(null);

        antdMessage.success("Group profile updated successfully");

        // Do not call loadMembers() here.
        // It can overwrite the newly updated details with stale API data.

    } catch (error) {
        console.error("Failed to update group profile:", error);
        antdMessage.error("Unable to update group profile");
    } finally {
        setUpdatingDetails(false);
    }
};
    const handleEditGroupDetails = () => {
        editForm.setFieldsValue({
            groupName: groupDetails.name,
            groupDescription: groupDetails.description,
        });

        setSelectedGroupImage(null);
        setPreviewGroupImage(groupDetails.image);

        setEditDetailsOpen(true);
    };
    const handleEditImageSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            antdMessage.warning("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            antdMessage.warning("Image must be smaller than 5 MB");
            return;
        }

        console.log("Selected image:", file);
        console.log("Is File:", file instanceof File);

        setSelectedGroupImage(file);
        setPreviewGroupImage(URL.createObjectURL(file));
    };
    if (!group) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width="min(650px, 92vw)"
            centered
            destroyOnHidden
            className="group-info-modal"
            styles={{
                content: {
                    background: "var(--bg-gradient)",
                    padding: 12,
                    borderRadius: "14px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "75vh",
                },
                container: {
                    background: "var(--bg-gradient)",
                    padding: 12,
                    borderRadius: "14px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "75vh",
                },
                body: {
                    padding: 0,
                },
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

                        <div className="group-info-title-row">
                            <Title level={4} className="group-info-title">
                                {groupDetails.name}
                            </Title>

                            {isAdmin && (
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={handleEditGroupDetails}
                                    title="Edit group details"
                                    style={{
                                        color:"var(--text-primary)"
                                    }}
                                />
                            )}
                        </div>
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

                                {/* <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    loading={uploadingImage}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    Change group photo
                                </Button> */}
                            </>
                        )}
                    </div>
                </div>

                <Divider />

                <div className="group-info-description">
                    <div className="group-info-description-header">
                        <Text type="secondary">Group description</Text>

                        {/* {isAdmin && (
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={handleEditGroupDetails}
                            />
                        )} */}
                    </div>

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

                open={wallpaperOpen}
                onCancel={() => setWallpaperOpen(false)}
                footer={null}
                width={650}
                destroyOnHidden
                className="group-wallpaper-modal"
                styles={{
                    container: {
                        background: "var(--modal-bg, var(--bg-main))",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        boxShadow: "var(--glass-shadow)",
                    },
                    header: {
                        background: "transparent",
                        marginBottom: "14px",
                    },
                    body: {
                        background: "transparent",
                        color: "var(--text-primary)",
                        padding: "16px 0 0",
                    },
                    footer: {
                        background: "transparent",
                        marginTop: "16px",
                    },
                } as any}
            >
                <ConversationWallpaperPicker
                    conversationId={group.id}
                    scope="group"
                    onWallpaperChange={(url) => {
                        onGroupWallpaperChange?.(url);
                    }}
                />

            </Modal>
            <Modal
                title="Edit Group Details"
                open={editDetailsOpen}
                onCancel={() => setEditDetailsOpen(false)}
                onOk={() => editForm.submit()}
                okText="Save Changes"
                okButtonProps={{
                    className: "edit-group-ok-btn",
                }}
                cancelButtonProps={{
                    className: "edit-group-cancel-btn",
                }}
                confirmLoading={updatingDetails}
                destroyOnHidden
                className="edit-group-details-modal"
                styles={{
                    container: {
                        background: "var(--modal-bg)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        boxShadow: "var(--glass-shadow)",
                    },
                    header: {
                        background: "transparent",
                        marginBottom: "14px",
                    },
                    body: {
                        background: "transparent",
                        color: "var(--text-primary)",
                        padding: "8px 0 0",
                    },
                    footer: {
                        background: "transparent",
                        marginTop: "18px",
                    },
                }}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateGroupDetails}
                >
                    {/* Group Picture */}
                    <Form.Item label="Group Picture">
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}>
                            <Avatar
                                size={80}
                                src={previewGroupImage || undefined}
                                icon={<UserOutlined />}
                            />

                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="edit-group-image"
                                    hidden
                                    onChange={handleEditImageSelect}
                                />

                                <Button
                                    onClick={() =>
                                        document.getElementById("edit-group-image")?.click()
                                    }
                                >
                                    Upload Picture
                                </Button>

                                {selectedGroupImage && (
                                    <Typography.Text
                                        type="secondary"
                                        style={{ display: "block", marginTop: 6 }}
                                    >
                                        {selectedGroupImage.name}
                                    </Typography.Text>
                                )}
                            </div>
                        </div>
                    </Form.Item>
                    <Form.Item
                        label="Group Name"
                        name="groupName"
                        rules={[
                            {
                                required: true,
                                whitespace: true,
                                message: "Please enter group name",
                            },
                            {
                                max: 50,
                                message: "Group name cannot exceed 50 characters",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Enter group name"
                            maxLength={50}
                        // showCount
                        />
                    </Form.Item>

                    <Form.Item
                        label="Group Description"
                        name="groupDescription"
                        rules={[
                            {
                                max: 250,
                                message: "Description cannot exceed 250 characters",
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Enter group description"
                            maxLength={250}
                            showCount
                            autoSize={{ minRows: 3, maxRows: 5 }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
}
