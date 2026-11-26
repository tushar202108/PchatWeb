const API = {
  REGISTER: "/auth/register",
  SIGN_IN: "/auth/login",
  REFRESH: "/auth/refresh",
  SIGN_OUT: "/auth/logout",
  ME: "/auth/me",
  WS_TICKET: "/auth/ws-ticket",

  GET_PROFILE: "/auth/profile",
  UPDATE_PROFILE: "/profile/adduser",
  UPLOAD_PROFILE_PHOTO: "/auth/profile/photo",
  GET_CONTACTS: "/auth/GET_CONTACTS",
  GET_MESSAGES: "/auth/GET_MESSAGES",
  SEND_MESSAGE: "/auth/SEND_MESSAGE",
  GET_CONVERSATIONS: "/chats",
  CONVERSATIONS: "/chats",
  MESSAGES: "/chats",
  SEND_OTP: "/auth/send-otp",
  GetAllProfile: "/profile/getalluser",
  sendAttachment: "/files/upload",
  Create_group:"/groups/create",
  Get_my_group:"/groups/my-groups",
  get_group_members: (groupId: string) =>
  `/groups/members/${groupId}`,
  AddMember: (groupId: string) =>
  `/groups/addmember/${groupId}`,
  removeMember: (groupId: string, memberId: string) =>
  `/groups/${groupId}/members/${memberId}`,
  leaveGroup: (groupId: string) =>
  `/groups/${groupId}/leave`,
  promoteMember: (groupId: string , memberId:any) =>
  `/groups/${groupId}/promote/${memberId}`,
  updateGroupDetails: (groupId: string) =>
  `/groups/${groupId}/details`,
};

export default API;
