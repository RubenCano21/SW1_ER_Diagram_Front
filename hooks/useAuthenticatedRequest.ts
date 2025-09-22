// hooks/useAuthenticatedRequest.ts
'use client'

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AxiosResponse, AxiosError } from 'axios';

interface UseAuthenticatedRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthenticatedRequestReturn<T> extends UseAuthenticatedRequestState<T> {
  execute: (request: () => Promise<AxiosResponse<T>>) => Promise<T | null>;
  reset: () => void;
}

export const useAuthenticatedRequest = <T = any>(): UseAuthenticatedRequestReturn<T> => {
  const [state, setState] = useState<UseAuthenticatedRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { logout } = useAuth();

  const execute = useCallback(async (request: () => Promise<AxiosResponse<T>>): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await request();
      const data = response.data;
      
      setState(prev => ({ 
        ...prev, 
        data, 
        loading: false, 
        error: null 
      }));
      
      return data;
    } catch (err: any) {
      const error = err as AxiosError<{ message?: string }>;
      
      // Si es error 401, hacer logout automático
      if (error.response?.status === 401) {
        logout();
        return null;
      }

      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error en la petición';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      throw error;
    }
  }, [logout]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Hook específico para operaciones CRUD
export const useCrudOperations = <T extends { id: number }>() => {
  const { execute, loading, error } = useAuthenticatedRequest<T[]>();
  const [items, setItems] = useState<T[]>([]);

  const fetchAll = useCallback(async (request: () => Promise<AxiosResponse<T[]>>) => {
    const data = await execute(request);
    if (data) {
      setItems(data);
    }
    return data;
  }, [execute]);

  const create = useCallback(async (
    item: Omit<T, 'id'>, 
    request: (item: Omit<T, 'id'>) => Promise<AxiosResponse<T>>
  ) => {
    try {
      const response = await request(item);
      const newItem = response.data;
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }, []);

  const update = useCallback(async (
    id: number,
    updates: Partial<T>,
    request: (id: number, updates: Partial<T>) => Promise<AxiosResponse<T>>
  ) => {
    try {
      const response = await request(id, updates);
      const updatedItem = response.data;
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }, []);

  const remove = useCallback(async (
    id: number,
    request: (id: number) => Promise<AxiosResponse<void>>
  ) => {
    try {
      await request(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }, []);

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
};