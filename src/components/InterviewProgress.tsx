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
      {/* Professional Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Messages */}
        <div className="glass-card rounded-xl p-3 hover-lift border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Messages</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{messageCount}</p>
        </div>

        {/* Words */}
        <div className="glass-card rounded-xl p-3 hover-lift border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Words</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{wordCount}</p>
        </div>

        {/* Questions */}
        <div className="glass-card rounded-xl p-3 hover-lift border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Target size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Questions</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{questionsAnswered}</p>
        </div>

        {/* Progress */}
        <div className="glass-card rounded-xl p-3 hover-lift border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Progress</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Professional Progress Bar */}
      <div className="glass-card rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Book Progress</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {wordCount < targetWords 
            ? `${(targetWords - wordCount).toLocaleString()} words remaining` 
            : '🎉 Target achieved!'}
        </p>
      </div>
    </div>
  );
}
