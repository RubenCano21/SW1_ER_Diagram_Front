// lib/api.ts
import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { LoginCredentials, LoginResponse, User, ApiResponse } from '@/types/auth';

// Configuración base de la API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para requests - agregar token de autenticación si existe
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage (solo en el cliente)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    console.log('Request enviado:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error: AxiosError) => {
    console.error('Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores globales
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('Response recibido:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('Error en response:', error.response?.status, error.message);
    
    // Manejo de errores comunes
    if (error.response?.status === 401) {
      // Token expirado o no válido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.error('Acceso prohibido');
    } else if (error.response?.status && error.response.status >= 500) {
      console.error('Error del servidor');
    }
    
    return Promise.reject(error);
  }
);

// Servicios de API tipados
export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/login', credentials);
    return response.data.data || response.data;
  },
  
  register: async (userData: Partial<User> & { password: string }): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/auth/register', userData);
    return response.data.data || response.data;
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  
  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data.data || response.data;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/refresh', {
      refreshToken
    });
    return response.data.data || response.data;
  }
};

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const userService = {
  getAll: async (page: number = 0, size: number = 10): Promise<PaginatedResponse<User>> => {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await api.get(
      `/users?page=${page}&size=${size}`
    );
    return response.data.data || response.data;
  },
  
  getById: async (id: number): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/users/${id}`);
    return response.data.data || response.data;
  },
  
  create: async (userData: Omit<User, 'id'>): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/users', userData);
    return response.data.data || response.data;
  },
  
  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/users/${id}`, userData);
    return response.data.data || response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};

export default api;