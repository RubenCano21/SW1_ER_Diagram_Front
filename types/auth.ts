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
  // Diferentes posibles nombres para el token
  token?: string;
  accessToken?: string;
  jwt?: string;
  
  // Datos del usuario (opcional, podría venir por separado)
  user?: User;
  
  // Otros campos comunes en Spring Boot
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
  
  // En caso de que la respuesta sea el usuario directamente
  id?: number;
  username?: string;
  roles?: string | Role[];
  enabled?: boolean;
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