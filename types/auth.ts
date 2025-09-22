// types/auth.ts
export interface User {
  id: number;
  email: string;
  name: string;
  roles?: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
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
  login: (email: string, password: string) => Promise<LoginResult>;
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