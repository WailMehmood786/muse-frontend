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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Messages */}
      <div className="glass-card rounded-xl p-3 hover-lift">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Messages</span>
        </div>
        <p className="text-2xl font-bold text-gradient-animate">{messageCount}</p>
      </div>

      {/* Words */}
      <div className="glass-card rounded-xl p-3 hover-lift">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <FileText size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Words</span>
        </div>
        <p className="text-2xl font-bold text-gradient-animate">{wordCount.toLocaleString()}</p>
      </div>

      {/* Questions */}
      <div className="glass-card rounded-xl p-3 hover-lift">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Target size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Questions</span>
        </div>
        <p className="text-2xl font-bold text-gradient-animate">{questionsAnswered}</p>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-xl p-3 hover-lift">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <TrendingUp size={16} className="text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
        </div>
        <p className="text-2xl font-bold text-gradient-animate">{Math.round(progress)}%</p>
      </div>

      {/* Progress Bar (Full Width) */}
      <div className="col-span-2 sm:col-span-4">
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full hdr-gradient-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {wordCount < targetWords 
            ? `${(targetWords - wordCount).toLocaleString()} words to go!` 
            : '🎉 Target reached! Keep going for an even richer story.'}
        </p>
      </div>
    </div>
  );
}
