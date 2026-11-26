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
async createGroup(formData: FormData) {
  const { data } = await axiosService.post(
    API.Create_group,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
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
async removeGroupMembers(groupId: string, memberId:string) {
  const { data } = await axiosService.post(
    API.removeMember(groupId,memberId),
  );

  return data;
},
async leaveGroupMember(groupId: string, payload: any) {
  const { data } = await axiosService.post(
    API.leaveGroup(groupId),
    payload
  );

  return data;
},
async promoteGroupMember(groupId: string, memberId:any) {
  const { data } = await axiosService.put(
    API.promoteMember(groupId,memberId),
  );

  return data;
},

async updateGroupDetails(groupId: string, formData: FormData) {
  const { data } = await axiosService.post(
    API.updateGroupDetails(groupId),
    formData,
    {
      headers: {
        "Content-Type":"multipart/form-data",
      },
    }
  );

  return data;
},
};