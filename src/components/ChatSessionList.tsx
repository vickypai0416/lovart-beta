'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { Session } from '@/lib/session-manager';

interface ChatSessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSwitch: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCreate: () => void;
}

export default function ChatSessionList({ sessions, currentSessionId, onSwitch, onDelete, onCreate }: ChatSessionListProps) {
  return (
    <div className="w-64 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">会话列表</h3>
          <button
            onClick={onCreate}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            title="新建会话"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              currentSessionId === session.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSwitch(session.id)}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">
                {session.title || '新会话'}
              </p>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {session.messages.length} 条消息
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
