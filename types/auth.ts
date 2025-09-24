// types/auth.ts
export interface User {
  id: number;
  username: string;
  roles?: Role[];
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
  refreshToken?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: () => boolean;
  refreshToken?: () => Promise<void>;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}