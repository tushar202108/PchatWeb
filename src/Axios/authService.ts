
import { axiosService } from "./axiosService";
import API from "../services/APIEndpoint";

export const authService = {
  async register(payload: { email: string; password: string }) {
    const { data } = await axiosService.post(API.REGISTER, payload);
    return data;
  },

  async signIn(payload: { email: string; password: string; username: string }) {
    const { data } = await axiosService.post(API.SIGN_IN, payload);
    return data;
  },

  async refresh(payload:{refreshToken:string}) {
    const { data } = await axiosService.post(API.REFRESH,payload);
    return data;
  },

  async signOut(payload:{refreshToken:string}) {
    const { data } = await axiosService.post(API.SIGN_OUT,payload);
    return data;
  },

  async getCurrentUser() {
    const { data } = await axiosService.get(API.ME);
    return data;
  },
};
