export type AdminRole = "SUPER_ADMIN" | "SUPPORT";

export interface AdminUser {
  userId: string;
  email: string;
  role: AdminRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export interface RefreshResponse {
  accessToken: string;
  user: AdminUser;
}
