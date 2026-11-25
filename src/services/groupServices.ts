import { axiosService } from "../Axios/axiosService";
import type { MyGroup } from "../types/myGroup.types";
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
   async GetGroups(): Promise<MyGroup[]> {
    const { data } = await axiosService.get<MyGroup[]>(
      API.Get_my_group
    );

    return data;
  },
async getGroupMembers(groupId: string) {
  const { data } = await axiosService.get(
    API.get_group_members(groupId)
  );

  return data;
},

async addGroupMembers(groupId: string, payload: any) {
  const { data } = await axiosService.post(
    API.AddMember(groupId),
    payload
  );

  return data;
},
};