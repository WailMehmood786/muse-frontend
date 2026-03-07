"use client";

import { useState, useEffect } from 'react';
import { Lightbulb, Target, Heart, TrendingUp, X, Sparkles } from 'lucide-react';

interface InterviewHelperProps {
  messageCount: number;
  wordCount: number;
  lastUserMessage?: string;
}

export default function InterviewHelper({ messageCount, wordCount, lastUserMessage }: InterviewHelperProps) {
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [tipType, setTipType] = useState<'suggestion' | 'encouragement' | 'milestone'>('suggestion');

  useEffect(() => {
    // Show tips based on interview progress
    if (messageCount === 1) {
      setCurrentTip("Great start! Share specific details - names, places, emotions. The more vivid, the better your story.");
      setTipType('suggestion');
      setShowTip(true);
    } else if (messageCount === 5) {
      setCurrentTip("You're doing amazing! Keep going - every detail you share makes your story more powerful.");
      setTipType('encouragement');
      setShowTip(true);
    } else if (messageCount === 10) {
      setCurrentTip("🎉 10 messages! You're building something special. Don't hold back on emotions and feelings.");
      setTipType('milestone');
      setShowTip(true);
    } else if (wordCount >= 500 && wordCount < 510) {
      setCurrentTip("🎊 500 words milestone! Your story is taking shape beautifully.");
      setTipType('milestone');
      setShowTip(true);
    } else if (wordCount >= 1000 && wordCount < 1010) {
      setCurrentTip("🌟 1000 words! You're halfway to a powerful chapter. Keep the momentum going!");
      setTipType('milestone');
      setShowTip(true);
    }

    // Auto-hide tips after 8 seconds
    if (showTip) {
      const timer = setTimeout(() => setShowTip(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [messageCount, wordCount]);

  // Analyze last message for suggestions
  useEffect(() => {
    if (!lastUserMessage || lastUserMessage.length < 10) return;

    const message = lastUserMessage.toLowerCase();
    
    // Check if message is too short
    if (lastUserMessage.split(' ').length < 5 && messageCount > 3) {
      setCurrentTip("💡 Try sharing more details! Describe what you saw, felt, or heard in that moment.");
      setTipType('suggestion');
      setShowTip(true);
    }
    // Check if message lacks emotion words
    else if (!message.match(/feel|felt|emotion|happy|sad|scared|excited|proud|angry|love|hate|joy|pain/)) {
      if (messageCount > 5 && Math.random() > 0.7) {
        setCurrentTip("💭 How did that make you feel? Emotions make your story unforgettable.");
        setTipType('suggestion');
        setShowTip(true);
      }
    }
  }, [lastUserMessage, messageCount]);

  const getTipIcon = () => {
    switch (tipType) {
      case 'suggestion': return <Lightbulb size={18} className="text-yellow-500" />;
      case 'encouragement': return <Heart size={18} className="text-pink-500" />;
      case 'milestone': return <Sparkles size={18} className="text-purple-500" />;
      default: return <Target size={18} className="text-blue-500" />;
    }
  };

  const getTipColor = () => {
    switch (tipType) {
      case 'suggestion': return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'encouragement': return 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-800';
      case 'milestone': return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800';
      default: return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
    }
  };

  if (!showTip) return null;

  return (
    <div className={`fixed top-20 right-4 max-w-sm z-50 animate-slideInRight`}>
      <div className={`${getTipColor()} border-2 rounded-2xl p-4 shadow-ultra glass-card`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 animate-float">
            {getTipIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {currentTip}
            </p>
          </div>
          <button
            onClick={() => setShowTip(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
