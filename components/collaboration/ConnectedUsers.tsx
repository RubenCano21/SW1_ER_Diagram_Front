// components/collaboration/ConnectedUsers.tsx
import React from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface ConnectedUsersProps {
  isConnected: boolean;
  connectedUsers: Array<{
    userId: string;
    username: string;
    color: string;
    canEdit?: boolean;
  }>;
}

export const ConnectedUsers: React.FC<ConnectedUsersProps> = ({ 
  isConnected, 
  connectedUsers 
}) => {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm">
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm text-gray-600">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
      
      <div className="h-4 w-px bg-gray-300" />
      
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-600" />
        <div className="flex -space-x-2">
          {connectedUsers.slice(0, 5).map((user) => (
            <div
              key={user.userId}
              className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
              title={`${user.username}${user.canEdit ? ' (puede editar)' : ' (solo lectura)'}`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        
        {connectedUsers.length > 5 && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            +{connectedUsers.length - 5}
          </span>
        )}
        
        <span className="text-sm text-gray-600">
          {connectedUsers.length === 0 ? 'Solo tú' : `${connectedUsers.length + 1} usuarios`}
        </span>
      </div>
    </div>
  );
};