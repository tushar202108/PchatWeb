
import { useMemo, useState } from "react";

import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Input,
  List,
  Modal,
  Tag,
  Typography,
  message as antdMessage,
} from "antd";

import {
  SearchOutlined,
  UserOutlined,
  UserAddOutlined,
  CrownOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { groupService } from "../../services/groupServices";
import "./GroupInfoModal.css";
import type { GroupMember } from "../../types/groupInfoModal.types";

const { Text } = Typography;

interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface Props {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  isAdmin: boolean;
  contacts?: Contact[];
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function GroupMembersList({
  groupId,
  members,
  currentUserId,
  isAdmin,
  contacts = [],
  onAddMembers,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const contactMap = useMemo(
    () =>
      new Map(
        contacts.map((contact) => [
          String(contact.id),
          contact,
        ])
      ),
    [contacts]
  );

  const getMemberDetails = (member: GroupMember) => {
    const memberId = String(member.userId);
    const contact = contactMap.get(memberId);

    const creator = member.chatGroup?.createdBy;
    const isCreator =
      creator && String(creator.id) === memberId;

    return {
      id: memberId,
      name:
        contact?.name ||
        (isCreator ? creator.username : "") ||
        `User ${memberId}`,
      email:
        contact?.email ||
        (isCreator ? creator.email : "") ||
        "",
    };
  };

  const filteredMembers = members.filter((member) => {
    const details = getMemberDetails(member);

    return `${details.name} ${details.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  const existingMemberIds = new Set(
    members.map((member) => String(member.userId))
  );

  const availableContacts = contacts.filter(
    (contact) =>
      !existingMemberIds.has(String(contact.id)) &&
      contact.name
        .toLowerCase()
        .includes(addSearch.trim().toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedMembers.length) {
      antdMessage.warning("Select at least one member");
      return;
    }

    try {
      setAdding(true);

      await onAddMembers(selectedMembers);
      await onRefresh();

      setSelectedMembers([]);
      setAddSearch("");
      setAddModalOpen(false);
    } catch (error) {
      console.error("Unable to add members:", error);
    } finally {
      setAdding(false);
    }
  };

  const handlePromote = (member: GroupMember) => {
    const details = getMemberDetails(member);

    Modal.confirm({
      title: "Make group admin?",
      content: `Are you sure you want to make ${details.name} a group admin?`,
      okText: "Make admin",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(true);

          await groupService.promoteGroupMember(groupId,member.userId);

          antdMessage.success(
            `${details.name} is now a group admin`
          );

          await onRefresh();
        } catch (error) {
          console.error("Failed to promote member:", error);
          antdMessage.error("Unable to make member an admin");
          throw error;
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRemove = (member: GroupMember) => {
    const details = getMemberDetails(member);

    Modal.confirm({
      title: "Remove group member?",
      content: `Are you sure you want to remove ${details.name} from this group?`,
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setActionLoading(true);

          await groupService.removeGroupMembers(
            groupId,
            String(member.userId)
          );

          antdMessage.success("Member removed successfully");

          await onRefresh();
        } catch (error) {
          console.error("Failed to remove member:", error);
          antdMessage.error("Unable to remove member");
          throw error;
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <div className="group-members-panel">
      <div className="group-members-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search members"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />

        {isAdmin && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            Add
          </Button>
        )}
      </div>

      <Text type="secondary" className="group-members-count">
        {members.length} participants
      </Text>

      <List
        dataSource={filteredMembers}
        locale={{ emptyText: "No members found" }}
        renderItem={(member) => {
          const details = getMemberDetails(member);
          const admin =
            member.role?.toUpperCase() === "ADMIN";

          const isSelf =
            String(member.userId) === String(currentUserId);

          const menuItems = isAdmin && !isSelf
            ? [
                ...(!admin
                  ? [
                      {
                        key: "promote",
                        label: "Make group admin",
                        icon: <CrownOutlined />,
                      },
                    ]
                  : []),
                {
                  key: "remove",
                  label: "Remove from group",
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ]
            : [];

          return (
            <Dropdown
              trigger={["contextMenu"]}
              disabled={menuItems.length === 0 || actionLoading}
              menu={{
                items: menuItems,
                onClick: ({ key }) => {
                  if (key === "promote") {
                    handlePromote(member);
                  }

                  if (key === "remove") {
                    handleRemove(member);
                  }
                },
              }}
            >
              <div>
                <List.Item className="group-member-item">
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={<UserOutlined />} />
                    }
                    title={
                      <div className="group-member-title">
                        <Text strong>{details.name}</Text>

                        {isSelf && (
                          <Text type="secondary">(You)</Text>
                        )}
                      </div>
                    }
                    description={
                      details.email || `ID: ${details.id}`
                    }
                  />

                  {admin && (
                    <Tag color="gold">
                      <CrownOutlined /> Group Admin
                    </Tag>
                  )}
                </List.Item>
              </div>
            </Dropdown>
          );
        }}
      />

      <Modal
        title="Add group members"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          setSelectedMembers([]);
          setAddSearch("");
        }}
        onOk={handleAdd}
        okText="Add members"
        okButtonProps={{
          className: "group-modal-primary-btn",
        }}
        cancelButtonProps={{
          className: "group-modal-cancel-btn",
        }}
        confirmLoading={adding}
        destroyOnHidden
        className="group-add-members-modal"
        styles={{
          content: {
            background: "black",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px 24px",
            boxShadow: "var(--glass-shadow)",
          },
          header: {
            marginBottom: "14px",
          },
          body: {
            background: "transparent",
            color: "var(--text-primary)",
          },
          container: {
            background: "var(--bg-gradient)",
          },
          footer: {
            background: "transparent",
            marginTop: "16px",
          },
        } as any}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search contacts"
          value={addSearch}
          onChange={(event) => setAddSearch(event.target.value)}
          allowClear
        />

        <div className="add-group-members-list">
          {availableContacts.length === 0 ? (
            <Text type="secondary">
              No available contacts found
            </Text>
          ) : (
            availableContacts.map((contact) => (
              <Checkbox
                key={contact.id}
                checked={selectedMembers.includes(String(contact.id))}
                onChange={(event) => {
                  setSelectedMembers((current) =>
                    event.target.checked
                      ? [...current, String(contact.id)]
                      : current.filter(
                          (id) => id !== String(contact.id)
                        )
                  );
                }}
              >
                <div className="add-group-contact">
                  <Avatar icon={<UserOutlined />} size={30} />
                  <span>{contact.name}</span>
                </div>
              </Checkbox>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
