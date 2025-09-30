// lib/websocket/useWebSocket.ts - VERSIÓN CORREGIDA

import { useCallback, useEffect, useRef, useState } from 'react';
import { CollaborationMessage, CollaborationMessageType, ConnectedUser, UserCursor } from './types';

interface UseWebSocketProps {
  projectId: string;
  token: string;
  enabled?: boolean;
  onMessage?: (message: CollaborationMessage) => void;
}

export const useWebSocket = ({ projectId, token, enabled = true, onMessage }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [lockedNodes, setLockedNodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<CollaborationMessage[]>([]);
  
  // IMPORTANTE: Usar ref para enabled para evitar recrear funciones
  const enabledRef = useRef(enabled);
  const onMessageRef = useRef(onMessage);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

  // Actualizar refs cuando cambien las props
  useEffect(() => {
    enabledRef.current = enabled;
    onMessageRef.current = onMessage;
  }, [enabled, onMessage]);

  const handleMessage = useCallback((message: CollaborationMessage) => {
    switch (message.type) {
      case CollaborationMessageType.CONNECTED_USERS:
        setConnectedUsers(message.data.users || []);
        break;

      case CollaborationMessageType.USER_JOINED:
        setConnectedUsers(prev => {
          const exists = prev.some(u => u.userId === message.data.userId);
          if (exists) return prev;
          return [...prev, {
            userId: message.data.userId,
            username: message.data.username,
            connectedAt: Date.now(),
            color: getRandomColor(),
            canEdit: message.data.canEdit
          }];
        });
        break;

      case CollaborationMessageType.USER_LEFT:
        setConnectedUsers(prev => prev.filter(u => u.userId !== message.data.userId));
        setUserCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.delete(message.data.userId);
          return newCursors;
        });
        break;

      case CollaborationMessageType.USER_CURSOR:
        setUserCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(message.userId, {
            userId: message.userId,
            username: message.username,
            x: message.data.x,
            y: message.data.y,
            color: message.data.color || getRandomColor()
          });
          return newCursors;
        });
        break;

      case CollaborationMessageType.NODE_LOCKED:
        setLockedNodes(prev => new Set([...prev, message.data.nodeId]));
        break;

      case CollaborationMessageType.NODE_UNLOCKED:
        setLockedNodes(prev => {
          const newLocked = new Set(prev);
          newLocked.delete(message.data.nodeId);
          return newLocked;
        });
        break;

      case CollaborationMessageType.LOCKED_NODES:
        setLockedNodes(new Set(message.data.lockedNodes || []));
        break;

      case CollaborationMessageType.ERROR:
        console.error('Collaboration error:', message.data.message);
        setError(message.data.message);
        break;

      case CollaborationMessageType.PONG:
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
    
    // Llamar al callback externo si existe
    onMessageRef.current?.(message);
  }, []);

  const sendMessage = useCallback((message: Partial<CollaborationMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending message:', err);
      }
    } else {
      messageQueueRef.current.push(message as CollaborationMessage);
    }
  }, []);

  // SOLUCIÓN: Usar useCallback sin dependencias de estado
  // lib/websocket/useWebSocket.ts - Versión con mejor debugging

const connect = useCallback(() => {
  // Validaciones mejoradas
  if (!projectId || projectId === '' || projectId === 'temp-project') {
    console.log('WebSocket not connecting: invalid projectId:', projectId);
    return;
  }
  
  if (!enabledRef.current) {
    console.log('WebSocket not connecting: disabled');
    return;
  }
  
  if (!token) {
    console.log('WebSocket not connecting: no token');
    return;
  }
  
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return;
  }

  try {
    const wsUrl = `${WS_URL}/ws/collaboration/${projectId}?token=${token}`;
    console.log('🔌 Attempting WebSocket connection to:', wsUrl);

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      setError(null);

      // Enviar mensajes en cola
      if (messageQueueRef.current.length > 0) {
        console.log('Sending queued messages:', messageQueueRef.current.length);
        messageQueueRef.current.forEach(msg => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
          }
        });
        messageQueueRef.current = [];
      }

      // Iniciar heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: CollaborationMessageType.PING,
            userId: '',
            username: '',
            projectId,
            data: {},
            timestamp: Date.now(),
          }));
        }
      }, 30000);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: CollaborationMessage = JSON.parse(event.data);
        console.log('📨 Received message:', message.type);
        handleMessage(message);
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err);
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('❌ WebSocket error occurred');
      console.error('Error details:', {
        readyState: wsRef.current?.readyState,
        url: wsRef.current?.url,
        event
      });
      setError('Error de conexión WebSocket');
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      
      setIsConnected(false);

      // Limpiar heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Mapear códigos de error comunes
      if (event.code === 1006) {
        console.error('❌ Conexión cerrada anormalmente - posible problema de red o CORS');
      } else if (event.code === 1008) {
        console.error('❌ Conexión rechazada por política - posible problema de autenticación');
      } else if (event.code === 4000) {
        console.error('❌ Error de autenticación - token inválido o expirado');
      }

      // Intentar reconectar solo si no fue cierre intencional
      if (event.code !== 1000 && enabledRef.current && projectId && token) {
        console.log('⏳ Intentando reconectar en 3 segundos...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  } catch (err) {
    console.error('❌ Error creating WebSocket:', err);
    setError('No se pudo establecer la conexión');
  }
}, [projectId, token, WS_URL, handleMessage]); // Solo dependencias primitivas

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectedUsers([]);
    setUserCursors(new Map());
    setLockedNodes(new Set());
  }, []); // Sin dependencias

  // Efecto para conectar/desconectar
  useEffect(() => {
    if (enabled && projectId && token) {
      connect();
    }

    // Cleanup al desmontar
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [enabled, projectId, token, connect]); // SOLO estas dependencias

  return {
    isConnected,
    connectedUsers,
    userCursors,
    lockedNodes,
    error,
    sendMessage,
    connect,
    disconnect,
  };
};

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#74B9FF', '#A29BFE', '#FD79A8', '#E17055', '#00B894'
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];