"use client";

import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  isSaving?: boolean;
  lastSaved?: Date;
  error?: boolean;
}

export default function AutoSaveIndicator({ isSaving = false, lastSaved, error = false }: Props) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / 60000);

      if (diffSecs < 10) {
        setTimeAgo('just now');
      } else if (diffSecs < 60) {
        setTimeAgo(`${diffSecs}s ago`);
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m ago`);
      } else {
        setTimeAgo(lastSaved.toLocaleTimeString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
        <CloudOff size={16} />
        <span>Save failed</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
        <Loader2 size={16} className="animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
        <Check size={16} />
        <span>Saved {timeAgo}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
      <Cloud size={16} />
      <span>Auto-save enabled</span>
    </div>
  );
}
