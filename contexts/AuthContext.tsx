// contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthContextType, LoginResult } from '@/types/auth';
import { authService } from '@/lib/api';
import api from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const router = useRouter();

  // Marcar como montado
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Solo ejecutar en el cliente después de que esté montado
    if (!mounted) return;

    // Verificar si hay token guardado al cargar la app
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      validateToken(savedToken);
    } else {
      setLoading(false);
    }
  }, [mounted]);

  const validateToken = async (tokenToValidate: string): Promise<void> => {
    try {
      // Configurar el token en el header de axios
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenToValidate}`;
      
      // Obtener datos del usuario con el token
      const userData = await authService.getProfile();
      setUser(userData);
      setToken(tokenToValidate);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      setLoading(true);
      
      const response = await authService.login({ username, password });
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!response.token || !response.user) {
        throw new Error('Respuesta del servidor inválida');
      }

      const { token: newToken, user: userData } = response;
      
      // Guardar token en localStorage
      localStorage.setItem('authToken', newToken);
      
      // Configurar token en axios
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Actualizar estado
      setToken(newToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Error en login:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Error al iniciar sesión';
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    // Limpiar localStorage
    localStorage.removeItem('authToken');
    
    // Limpiar headers de axios
    delete api.defaults.headers.common['Authorization'];
    
    // Limpiar estado
    setToken(null);
    setUser(null);
    
    // Redirigir a login usando App Router
    router.push('/login');
  };

  const isAuthenticated = (): boolean => {
    return !!token && !!user;
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshTokenValue);
      
      // Actualizar tokens
      localStorage.setItem('authToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Configurar nuevo token
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      setToken(response.token);
      setUser(response.user);
      
    } catch (error) {
      console.error('Error al renovar token:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};