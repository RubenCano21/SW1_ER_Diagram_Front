// lib/websocket/types.ts
export enum CollaborationMessageType {
  // Gestión de usuarios
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  CONNECTED_USERS = 'CONNECTED_USERS',
  
  // Operaciones con nodos
  NODE_CREATED = 'NODE_CREATED',
  NODE_UPDATED = 'NODE_UPDATED',
  NODE_DELETED = 'NODE_DELETED',
  NODE_LOCKED = 'NODE_LOCKED',
  NODE_UNLOCKED = 'NODE_UNLOCKED',
  
  // Operaciones con edges
  EDGE_CREATED = 'EDGE_CREATED',
  EDGE_UPDATED = 'EDGE_UPDATED',
  EDGE_DELETED = 'EDGE_DELETED',
  
  // Interacción en tiempo real
  USER_CURSOR = 'USER_CURSOR',
  SELECTION_CHANGED = 'SELECTION_CHANGED',
  
  // Sistema
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG',
  LOCKED_NODES = 'LOCKED_NODES'
}

export interface CollaborationMessage {
  type: CollaborationMessageType;
  userId: string;
  username: string;
  projectId: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface ConnectedUser {
  userId: string;
  username: string;
  connectedAt: number;
  avatar?: string;
  color: string;
  canEdit?: boolean;
}

export interface UserCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}