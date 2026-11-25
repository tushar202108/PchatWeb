export interface GroupConversation {
  id: string;
  name: string;
}

export interface CreateGroupModalProps {
  open: boolean;
  conversations: GroupConversation[];
  onClose: () => void;
  onCreate: (name: string, members: string[]) => void;
    loadMyGroups: () => Promise<void>;
}

export interface SelectGroupMembersProps {
  conversations: GroupConversation[];
  selectedMembers: string[];
  onChange: (members: string[]) => void;
}

export interface MyGroup {
  groupId: string;
  groupName: string;
  groupDescription: string;
  groupImage: string;
  createdAt: string;
  active: boolean;
  createdBy: {
    id: number;
    username: string;
    email: string;
  };
}
export interface GroupMember {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "LEFT" | string;
  joinedAt: string;
  leftAt: string | null;
  chatGroup: {
    groupId: string;
    groupName: string;
    groupDescription: string;
    groupImage: string;
    createdAt: string;
    active: boolean;
    createdBy: {
      id: number;
      username: string;
      email: string;
    };
  };
}