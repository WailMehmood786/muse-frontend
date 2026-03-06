"use client";

import { Copy, Mail, Trash2, Clock, BookOpen, TrendingUp, Eye } from 'lucide-react';
import { useState } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  bookTitle: string;
  uniqueLink: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  wordCount: number;
  lastActive: string;
  sport?: string;
  messages?: any[];
}

interface Props {
  client: Client;
  onSelect: () => void;
  onCopyLink: () => void;
  onSendEmail: () => void;
  onDelete: () => void;
}

export default function ClientCard({ client, onSelect, onCopyLink, onSendEmail, onDelete }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{client.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
              {client.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <BookOpen size={14} />
            {client.bookTitle}
          </p>
          {client.sport && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Sport: {client.sport}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium">{client.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${getProgressColor(client.progress)}`}
            style={{ width: `${client.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <TrendingUp size={12} />
            Words
          </div>
          <div className="font-semibold">{client.wordCount.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
            <Clock size={12} />
            Last Active
          </div>
          <div className="font-semibold text-sm">{formatDate(client.lastActive)}</div>
        </div>
      </div>

      {/* Messages Preview */}
      {client.messages && client.messages.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Eye size={14} />
            {showPreview ? 'Hide' : 'Show'} Preview ({client.messages.length} messages)
          </button>
          {showPreview && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm max-h-32 overflow-y-auto">
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                {client.messages[client.messages.length - 1]?.text || 'No messages yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Open Interview
        </button>
        <button
          onClick={onCopyLink}
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Copy Link"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={onSendEmail}
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Send Email"
        >
          <Mail size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
