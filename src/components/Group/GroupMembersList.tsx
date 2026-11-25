
import { useMemo, useState } from "react";

import {
  Avatar,
  Button,
  Checkbox,
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
} from "@ant-design/icons";

import type { GroupMember } from "./GroupInfoModal";
import "./GroupInfoModal.css"
const { Text } = Typography;

interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface Props {
  members: GroupMember[];
  currentUserId: string;
  isAdmin: boolean;
  contacts?: Contact[];
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function GroupMembersList({
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

          return (
            <List.Item className="group-member-item">
              <List.Item.Meta
                avatar={
                  <Avatar icon={<UserOutlined />} />
                }
                title={
                  <div className="group-member-title">
                    <Text strong>{details.name}</Text>

                    {details.id === String(currentUserId) && (
                      <Text type="secondary">(You)</Text>
                    )}
                  </div>
                }
                description={details.email || `ID: ${details.id}`}
              />

              {admin && (
                <Tag color="gold">
                  <CrownOutlined /> Group Admin
                </Tag>
              )}
            </List.Item>
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
        confirmLoading={adding}
        destroyOnHidden
        className="group-add-members-modal"
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
