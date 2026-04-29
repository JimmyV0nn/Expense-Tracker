export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Activity {
  id: number;
  user_id: number;
  user_email: string;
  action: "register" | "login" | "logout";
  timestamp: string;
  ip_address: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  is_admin?: boolean;
  is_active?: boolean;
}

export interface ActivityQuery {
  user_email?: string;
  action?: string;
  skip?: number;
  limit?: number;
}
