"use client";

import { MessageSquare, FileText, Target, TrendingUp } from 'lucide-react';

interface InterviewProgressProps {
  messageCount: number;
  wordCount: number;
  targetWords?: number;
}

export default function InterviewProgress({ 
  messageCount, 
  wordCount, 
  targetWords = 2000 
}: InterviewProgressProps) {
  const progress = Math.min((wordCount / targetWords) * 100, 100);
  const questionsAnswered = Math.floor(messageCount / 2);

  return (
    <div className="space-y-3">
      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {/* Messages */}
        <div className="glass-card rounded-lg p-2 hover-lift text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Messages</span>
          </div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{messageCount}</p>
        </div>

        {/* Words */}
        <div className="glass-card rounded-lg p-2 hover-lift text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FileText size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Words</span>
          </div>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{wordCount}</p>
        </div>

        {/* Questions */}
        <div className="glass-card rounded-lg p-2 hover-lift text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target size={14} className="text-green-600 dark:text-green-400" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Questions</span>
          </div>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{questionsAnswered}</p>
        </div>

        {/* Progress */}
        <div className="glass-card rounded-lg p-2 hover-lift text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className="text-orange-600 dark:text-orange-400" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Progress</span>
          </div>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full hdr-gradient-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
          {wordCount < targetWords 
            ? `${(targetWords - wordCount).toLocaleString()} words to go` 
            : '🎉 Target reached!'}
        </p>
      </div>
    </div>
  );
}
