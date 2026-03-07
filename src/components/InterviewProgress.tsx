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
    <div className="space-y-2">
      {/* Ultra Compact Stats Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Messages */}
        <div className="flex items-center gap-1.5 glass-card rounded-lg px-2 py-1 hover-lift">
          <MessageSquare size={12} className="text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{messageCount}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">msgs</p>
          </div>
        </div>

        {/* Words */}
        <div className="flex items-center gap-1.5 glass-card rounded-lg px-2 py-1 hover-lift">
          <FileText size={12} className="text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400">{wordCount}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">words</p>
          </div>
        </div>

        {/* Questions */}
        <div className="flex items-center gap-1.5 glass-card rounded-lg px-2 py-1 hover-lift">
          <Target size={12} className="text-green-600 dark:text-green-400" />
          <div>
            <p className="text-xs font-bold text-green-600 dark:text-green-400">{questionsAnswered}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">ques</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 glass-card rounded-lg px-2 py-1 hover-lift">
          <TrendingUp size={12} className="text-orange-600 dark:text-orange-400" />
          <div>
            <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{Math.round(progress)}%</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">done</p>
          </div>
        </div>
      </div>

      {/* Ultra Thin Progress Bar */}
      <div>
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full hdr-gradient-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
