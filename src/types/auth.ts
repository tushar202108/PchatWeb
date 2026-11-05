
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    profileImage?: string;
    profileCompleted: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: AuthUser;
}

export interface RegisterPayload {
    email: string;
    password: string;
    username: string;
    otp: number;
}

export interface SignInPayload {
    email: string;
    password: string;
}

export interface ProfilePayload {
    name: string;
    profileImage?: string;
    userId: string;
}
