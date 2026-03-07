"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Volume2, Loader2, Sparkles, Download, FileText, FileDown, Zap, Brain } from 'lucide-react';
import { exportToPDF, exportToMarkdown, exportToText, exportToDOCX } from '@/utils/pdfExport';
import InterviewHelper from './InterviewHelper';
import InterviewProgress from './InterviewProgress';

type Message = { role: 'user' | 'ai'; text: string };

interface Props {
  clientName: string;
  bookTitle: string;
  messages: Message[];
  input: string;
  loading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceActive: boolean;
  wordCount: number;
  bookDraft: string;
  onSend: (text: string) => void;
  onInputChange: (text: string) => void;
  onToggleVoice: () => void;
  onToggleListening: () => void;
  onSpeak: (text: string, index: number) => void;
  speakingIndex: number | null;
  isPublisher?: boolean; // Optional: true for publisher, false/undefined for client
}

export default function ClientInterview({
  clientName, bookTitle, messages, input, loading, isListening, isSpeaking, isVoiceActive,
  wordCount, bookDraft, onSend, onInputChange, onToggleVoice, onToggleListening, onSpeak, speakingIndex,
  isPublisher = false // Default to false (client mode)
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExport = async (format: 'html' | 'docx' | 'markdown' | 'text') => {
    if (!bookDraft || bookDraft.trim().length === 0) {
      alert('No content to export yet. Start the interview first!');
      return;
    }

    try {
      switch (format) {
        case 'html':
          await exportToPDF(bookTitle, clientName, bookDraft);
          break;
        case 'docx':
          await exportToDOCX(bookTitle, clientName, bookDraft);
          break;
        case 'markdown':
          await exportToMarkdown(bookTitle, clientName, bookDraft);
          break;
        case 'text':
          await exportToText(bookTitle, clientName, bookDraft);
          break;
      }
      setShowExportMenu(false);
      alert(`Book exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export book. Please try again.');
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Interview Helper - Smart Tips */}
      <InterviewHelper 
        messageCount={messages.length} 
        wordCount={wordCount}
        lastUserMessage={messages.length > 0 ? messages[messages.length - 1]?.text : ''}
      />

      {/* Ultra Professional Header */}
      <div className="glass-ultra border-b border-gray-200 dark:border-gray-800 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg hdr-gradient-blue flex items-center justify-center shadow-glow-blue">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gradient-animate">{bookTitle}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">with {clientName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPublisher && wordCount > 0 && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover-lift hdr-gradient-forest text-white neon-green text-sm"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 glass-card rounded-xl shadow-ultra overflow-hidden z-50 animate-fadeIn">
                    <button
                      onClick={() => handleExport('docx')}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                    >
                      <FileDown size={18} className="text-blue-600" />
                      <div>
                        <p className="font-bold text-sm">Export as DOCX</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Microsoft Word format</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('html')}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                    >
                      <FileText size={18} className="text-red-500" />
                      <div>
                        <p className="font-bold text-sm">Export as HTML</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Formatted web document</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                    >
                      <FileText size={18} className="text-purple-500" />
                      <div>
                        <p className="font-bold text-sm">Export as Markdown</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Plain text with formatting</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('text')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3"
                    >
                      <FileText size={18} className="text-gray-500" />
                      <div>
                        <p className="font-bold text-sm">Export as Text</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Simple text file</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            <button onClick={onToggleVoice}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover-lift text-sm ${
                isVoiceActive ? 'hdr-gradient-blue text-white neon-blue animate-glow-pulse' : 'glass-card hover-glow'
              }`}>
              {isVoiceActive ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Voice Active</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span className="hidden sm:inline">Start Voice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interview Progress */}
        <InterviewProgress 
          messageCount={messages.length} 
          wordCount={wordCount}
          targetWords={2000}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-24 h-24 mx-auto mb-6 hdr-gradient-blue rounded-3xl flex items-center justify-center shadow-glow-blue animate-float">
                <Sparkles size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3 text-gradient-animate">Let's Tell Your Story</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg">
                I'm here to interview you for your autobiography. Just like a real conversation - I'll ask questions, you share your story.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="glass-card p-4 rounded-xl hover-lift">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Brain size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold mb-1">Smart Questions</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI asks deep, emotional questions</p>
                </div>
                <div className="glass-card p-4 rounded-xl hover-lift">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Zap size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-bold mb-1">Voice or Text</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Speak naturally or type freely</p>
                </div>
                <div className="glass-card p-4 rounded-xl hover-lift">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <FileText size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold mb-1">Auto Book</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your story becomes a book</p>
                </div>
              </div>
              <button onClick={onToggleVoice}
                className="px-8 py-4 hdr-gradient-blue text-white rounded-xl hover:shadow-glow-blue hover-lift-ultra neon-blue text-lg font-medium">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} />
                  <span>Start Interview</span>
                </div>
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                msg.role === 'user'
                  ? 'hdr-gradient-blue text-white shadow-glow-blue rounded-tr-sm hover-lift'
                  : 'glass-card rounded-tl-sm hover-lift border-l-4 border-blue-500 dark:border-purple-500'
              }`}>
                <div className={`prose prose-sm sm:prose max-w-none leading-relaxed ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.role === 'ai' && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => onSpeak(msg.text, i)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover-lift px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      {speakingIndex === i ? (
                        <>
                          <Volume2 size={14} className="animate-pulse" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>Read aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-gray-400 ml-4 animate-fadeIn">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full typing-dot" />
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full typing-dot" />
                <div className="w-2.5 h-2.5 bg-pink-500 rounded-full typing-dot" />
              </div>
              <span className="text-sm font-medium">AI is thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="glass-ultra border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-ultra">
        <div className="max-w-4xl mx-auto">
          {isVoiceActive && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm">
              {isListening ? (
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-600 dark:text-red-400 rounded-2xl animate-pulse shadow-lg border border-red-200 dark:border-red-800">
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                  <span className="font-semibold">Listening...</span>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800">
                  <Volume2 size={18} className="animate-pulse" />
                  <span className="font-semibold">Speaking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-3 glass-card text-gray-600 dark:text-gray-400 rounded-2xl shadow-lg">
                  <Sparkles size={18} className="text-purple-500" />
                  <span className="font-semibold">Voice mode active</span>
                </div>
              )}
            </div>
          )}

          <div className={`relative flex items-end gap-3 glass-card rounded-2xl p-4 transition-all duration-300 shadow-lg ${
            isListening ? 'shadow-glow-blue border-2 border-blue-500 scale-[1.02]' : 'border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl'
          }`}>
            <button onClick={onToggleListening} disabled={!isVoiceActive}
              className={`p-3.5 rounded-xl transition-all duration-300 ${
                isListening ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg animate-pulse neon-pink scale-110' :
                isVoiceActive ? 'glass-card text-gray-600 dark:text-gray-400 hover-lift hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                'glass-card text-gray-400 cursor-not-allowed opacity-50'
              }`}>
              {isListening ? <Mic size={22} /> : <MicOff size={22} />}
            </button>

            <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isListening ? "🎤 Listening... tell me your story" : "Share your story here, or use voice..."}
              className="flex-1 bg-transparent outline-none py-3 px-3 resize-none max-h-32 text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
              rows={1} disabled={isListening} />

            <button onClick={() => onSend(input)} disabled={!input.trim() || loading}
              className="p-3.5 hdr-gradient-blue text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-blue hover-lift-ultra transition-all duration-300 neon-blue">
              {loading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
