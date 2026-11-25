import { useState } from "react";
import {
  Input,
  Modal,

  Typography,
  Upload,
  message as antdMessage,
} from "antd";

import type { UploadFile, UploadProps } from "antd";

import {
  TeamOutlined,
   PlusOutlined,
} from "@ant-design/icons";

import "../../index.css";
import { groupService } from "../../services/groupServices";
import { PreviewImageTool } from "../PreviewImageTool/previewImageTool";
import { useAuth } from "../../context/authContext";
import type { CreateGroupModalProps} from "../../types/myGroup.types";
import { SelectGroupMembers } from "./groupSelectMember";

const { Text } = Typography;

export default function CreateGroupModal({
  open,
  conversations,
  onClose,
  onCreate,loadMyGroups
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupImageFile, setGroupImageFile] = useState<UploadFile[]>([]);
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const currentUserId = user?.id != null ? String(user.id) : undefined;
  const resetForm = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupImage("");
    setGroupImageFile([]);
    setGroupMembers([]);
    setPreviewOpen(false);
    setPreviewImage("");
  };
  const otherMembersCount = currentUserId
    ? groupMembers.filter((id) => String(id) !== currentUserId).length
    : groupMembers.length;

  const handleCreate = async () => {
    const trimmedName = groupName.trim();
    if (otherMembersCount < 2) {
      antdMessage.warning("Select at least 2 other members");
      return;
    }

    if (trimmedName.length < 3) {
      antdMessage.warning("Group name must be at least 3 characters");
      return;
    }

    if (groupMembers.length < 2) {
      antdMessage.warning("Select at least 2 members");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        groupName: trimmedName,
        groupDescription: groupDescription.trim(),
        groupImage: groupImage || "",
        memberIds: groupMembers.map(String),
      };

      const response = await groupService.createGroup(payload);

      console.log("Group created:", response);
      await loadMyGroups();
      antdMessage.success("Group created successfully");
      
      onCreate(trimmedName, groupMembers);

      resetForm();
    } catch (error) {
      console.error("Failed to create group:", error);
      antdMessage.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupImageChange: UploadProps["beforeUpload"] = (file) => {
    const isImage = file.type.startsWith("image/");

    if (!isImage) {
      antdMessage.error("Please select an image file");
      return Upload.LIST_IGNORE;
    }

    const isValidSize = file.size / 1024 / 1024 <= 5;

    if (!isValidSize) {
      antdMessage.error("Image must be smaller than 5MB");
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = String(reader.result || "");
      setGroupImage(base64);

      setGroupImageFile([
        {
          uid: file.uid,
          name: file.name,
          status: "done",
          url: base64,
        },
      ]);
    };

    reader.readAsDataURL(file);

    return false;
  };

  const handlePreview = (file: UploadFile) => {
    setPreviewImage(file.url || file.preview || groupImage || "");
    setPreviewOpen(true);
  };

  const handleApplyEditedImage = (editedBase64: string) => {
    setGroupImage(editedBase64);
    setGroupImageFile((prev) => {
      const existing = prev[0];
      return [
        {
          uid: existing?.uid || "-1",
          name: existing?.name || "group-image.jpg",
          status: "done",
          url: editedBase64,
        },
      ];
    });
  };

  const handleClose = () => {
    if (loading) return;

    resetForm();
    onClose();
  };

  return (
    <Modal
      rootClassName="create-group-modal new-chat-modal"
      title={
        <span style={{ color: "#ffffff", fontWeight: 600 }}>
          Create Group
        </span>
      }
      open={open}
      centered
      destroyOnClose
      width={460}
      className="stylish-gradient-modal"
      onCancel={handleClose}
      onOk={handleCreate}
      okText="Create Group"
      confirmLoading={loading}
      okButtonProps={{
        disabled:
          groupName.trim().length < 3 ||
          otherMembersCount < 2,
      }}
      cancelButtonProps={{
        style: {
          background: "transparent",
          borderColor: "rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
        },
        disabled: loading,
      }}
    >
      <div className="group-field">
        <Text className="group-label">Group name</Text>

        <Input
          prefix={<TeamOutlined />}
          placeholder="Enter group name"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          maxLength={50}
          size="large"
        />

        {groupName.trim().length > 0 &&
          groupName.trim().length < 3 && (
            <Text className="group-hint">
              Group name must be at least 3 characters.
            </Text>
          )}
      </div>

      <div className="group-field">
        <Text className="group-label">Group Description</Text>

        <Input.TextArea
          className="group-textarea"
          placeholder="What is this group about? (optional)"
          value={groupDescription}
          onChange={(event) =>
            setGroupDescription(event.target.value)
          }
          maxLength={250}
          showCount
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </div>

      <div className="group-field">
        <Text className="group-label group-label--centered">
          Group Image
        </Text>

        <div className="group-upload-center">
          <Upload
            accept="image/*"
            listType="picture-card"
            fileList={groupImageFile}
            maxCount={1}
            beforeUpload={handleGroupImageChange}
            onPreview={handlePreview}
            onRemove={() => {
              setGroupImage("");
              setGroupImageFile([]);
              return true;
            }}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
            }}
          >
            {groupImageFile.length === 0 && (
              <div className="group-upload-trigger">
                <PlusOutlined className="group-upload-icon" />
                <span className="group-upload-text">Upload Photo</span>
              </div>
            )}
          </Upload>

          <PreviewImageTool
            open={previewOpen}
            imageSrc={previewImage}
            onClose={() => setPreviewOpen(false)}
            onApply={handleApplyEditedImage}
          />

          <Text className="group-hint group-hint--centered">
            PNG or JPG up to 5MB
          </Text>
        </div>
      </div>

      <div className="group-field">
        <div className="group-label-row">
          <Text className="group-label">Add members</Text>

          <Text className="group-count">
            {groupMembers.length} selected
          </Text>
        </div>

        <SelectGroupMembers
          conversations={conversations}
          selectedMembers={groupMembers}
          onChange={setGroupMembers}
        />

        {otherMembersCount < 2 && (
          <Text className="group-hint">
            Select at least 2 members to create a group.
          </Text>
        )}
      </div>
    </Modal>
  );
}