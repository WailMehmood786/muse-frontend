"use client";

import { Lightbulb, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const tips = [
  "💡 Use voice mode for natural conversation - just like talking to a friend!",
  "🎯 Aim for 5000+ words for a complete biography chapter.",
  "📝 The AI adapts to YOUR story - there are no fixed questions.",
  "⏸️ Take breaks! The interview auto-saves your progress.",
  "🎤 Speak naturally - the AI will ask follow-up questions based on what you say.",
  "📚 You can export your book anytime in PDF, DOCX, or Markdown format.",
  "💬 Each response helps build your unique story in your own voice.",
  "🔄 You can continue the interview anytime - your progress is saved.",
  "✨ The more details you share, the richer your biography becomes.",
  "🎯 Focus on emotions and experiences - that's what makes stories powerful."
];

export default function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0);
  const [show, setShow] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed tips before
    const isDismissed = localStorage.getItem('tips_dismissed');
    if (isDismissed) {
      setDismissed(true);
      setShow(false);
    }
  }, []);

  useEffect(() => {
    if (!show || dismissed) return;

    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 10000); // Change tip every 10 seconds

    return () => clearInterval(interval);
  }, [show, dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('tips_dismissed', 'true');
  };

  const handleToggle = () => {
    setShow(!show);
  };

  if (dismissed && !show) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50"
        title="Show Tips"
      >
        <Lightbulb size={20} />
      </button>
    );
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 shadow-xl z-50 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-400 dark:bg-yellow-600 rounded-lg flex-shrink-0">
          <Lightbulb size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-200 mb-1">
            Quick Tip
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            {tips[currentTip]}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentTip 
                    ? 'w-4 bg-yellow-600 dark:bg-yellow-400' 
                    : 'w-1 bg-yellow-300 dark:bg-yellow-600'
                }`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors flex-shrink-0"
          title="Dismiss tips"
        >
          <X size={16} className="text-yellow-700 dark:text-yellow-300" />
        </button>
      </div>
    </div>
  );
}
