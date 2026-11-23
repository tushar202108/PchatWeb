import { axiosService } from "../Axios/axiosService";
import API from "./APIEndpoint";

export interface CreateGroupPayload {
  groupName: string;
  groupDescription: string;
  groupImage: string;
  memberIds: string[];
}

export const groupService = {
  async createGroup(payload: CreateGroupPayload) {
    const { data } = await axiosService.post(
      API.Create_group,
      payload
    );

    return data;
  },
};