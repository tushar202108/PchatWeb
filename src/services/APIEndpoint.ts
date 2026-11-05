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
  GetAllProfile: "/profile/getalluser"
};

export default API;
