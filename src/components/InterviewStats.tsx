"use client";

import { MessageSquare, FileText, Target, Clock, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  messageCount: number;
  wordCount: number;
  wordGoal?: number;
  duration?: string;
  bookDraft: string;
}

export default function InterviewStats({ messageCount, wordCount, wordGoal = 5000, duration, bookDraft }: Props) {
  const [copied, setCopied] = useState(false);
  
  const progress = Math.min((wordCount / wordGoal) * 100, 100);
  
  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(bookDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getProgressColor = () => {
    if (progress >= 80) return 'from-green-500 to-green-600';
    if (progress >= 50) return 'from-blue-500 to-blue-600';
    if (progress >= 25) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{messageCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <FileText size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Words</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{wordCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <Target size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Goal</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{Math.round(progress)}%</div>
            </div>
          </div>

          {duration && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Clock size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{duration}</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress to {wordGoal.toLocaleString()} words</span>
            <span className="font-medium">{wordCount.toLocaleString()} / {wordGoal.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDraft}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Draft</span>
              </>
            )}
          </button>
          
          {progress >= 100 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
              <Check size={16} />
              Goal Reached! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
