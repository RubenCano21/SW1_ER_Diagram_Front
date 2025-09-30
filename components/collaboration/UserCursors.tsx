// components/collaboration/UserCursors.tsx
import React from 'react';

interface UserCursorsProps {
  cursors: Map<string, {
    userId: string;
    username: string;
    x: number;
    y: number;
    color: string;
  }>;
}

export const UserCursors: React.FC<UserCursorsProps> = ({ cursors }) => {
  return (
    <>
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          className="fixed pointer-events-none z-50 transition-all duration-100"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <div className="relative">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 2L16.5 10L12.5 11L14.5 15L12 16.5L10 12.5L8.5 2Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="absolute top-6 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};