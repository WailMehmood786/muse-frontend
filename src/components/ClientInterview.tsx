"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Volume2, Loader2, Menu, X, MessageSquare, Download, FileDown, FileText, Sparkles, BookOpen, Zap } from 'lucide-react';
import { exportToPDF, exportToMarkdown, exportToText, exportToDOCX } from '@/utils/pdfExport';

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
  isPublisher?: boolean;
}

export default function ClientInterview({
  clientName, bookTitle, messages, input, loading, isListening, isSpeaking, isVoiceActive,
  wordCount, bookDraft, onSend, onInputChange, onToggleVoice, onToggleListening, onSpeak, speakingIndex,
  isPublisher = false
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format: 'html' | 'docx' | 'markdown' | 'text') => {
    if (!bookDraft || bookDraft.trim().length === 0) {
      alert('No content to export yet. Start the interview first!');
      return;
    }

    try {
      switch (format) {
        case 'html': await exportToPDF(bookTitle, clientName, bookDraft); break;
        case 'docx': await exportToDOCX(bookTitle, clientName, bookDraft); break;
        case 'markdown': await exportToMarkdown(bookTitle, clientName, bookDraft); break;
        case 'text': await exportToText(bookTitle, clientName, bookDraft); break;
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  const progress = Math.min((wordCount / 2000) * 100, 100);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-[#0a0a0f] dark:via-[#0f0f1a] dark:to-[#1a1a2e]">
      {/* Premium Sidebar - Toggle with menu button for everyone */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-80 bg-white/98 dark:bg-[#0f0f14]/98 backdrop-blur-3xl border-r border-gray-200/50 dark:border-gray-800/50 shadow-2xl transform transition-all duration-300 ease-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl flex-shrink-0 animate-pulse">
                  <BookOpen size={18} className="sm:w-[22px] sm:h-[22px] text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-sm sm:text-base truncate bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{bookTitle}</h2>
                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">with {clientName}</p>
                </div>
              </div>
              <button onClick={() => setShowSidebar(false)} className="p-2 sm:p-2.5 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all shadow-sm flex-shrink-0 ml-2">
                <X size={18} className="sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Interview Stats */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-indigo-200/50 dark:border-indigo-800/50 shadow-lg hover:shadow-xl transition-all backdrop-blur-sm">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles size={14} className="sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                Interview Progress
              </h3>
              <div className="space-y-2 sm:space-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300">Messages</span>
                  <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--foreground)' }}>{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300">Words Written</span>
                  <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--foreground)' }}>{wordCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300">Completion</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--foreground)' }}>Book Progress</span>
                <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 shadow-lg relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mt-2 sm:mt-3 font-medium">
                {wordCount < 2000 ? `${(2000 - wordCount).toLocaleString()} words remaining` : '🎉 Target achieved! Keep going!'}
              </p>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 flex items-center gap-2">
                <Zap size={14} className="sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
                Quick Tip
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {messages.length === 0 
                  ? "Click 'Start Voice' to begin your interview with AI"
                  : messages.length < 5
                  ? "Share detailed stories - the more you tell, the better your book!"
                  : wordCount < 500
                  ? "You're doing great! Keep sharing your experiences"
                  : "Amazing progress! Your story is taking shape beautifully"}
              </p>
            </div>

            {/* Export - Publisher Only */}
            {isPublisher && wordCount > 0 && (
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transform">
                  <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Export Your Book
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <button onClick={() => handleExport('docx')} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                      <FileDown size={16} className="text-indigo-600" /> 
                      <div>
                        <p className="font-medium">DOCX</p>
                        <p className="text-xs text-gray-500">Microsoft Word</p>
                      </div>
                    </button>
                    <button onClick={() => handleExport('html')} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                      <FileText size={16} className="text-red-600" /> 
                      <div>
                        <p className="font-medium">HTML</p>
                        <p className="text-xs text-gray-500">Web Document</p>
                      </div>
                    </button>
                    <button onClick={() => handleExport('markdown')} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                      <FileText size={16} className="text-purple-600" /> 
                      <div>
                        <p className="font-medium">Markdown</p>
                        <p className="text-xs text-gray-500">Plain Text</p>
                      </div>
                    </button>
                    <button onClick={() => handleExport('text')} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                      <FileText size={16} className="text-gray-600" /> 
                      <div>
                        <p className="font-medium">Text</p>
                        <p className="text-xs text-gray-500">Simple Format</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Premium Top Bar */}
        <div className="h-14 sm:h-16 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-3 sm:px-6 bg-white/95 dark:bg-[#0f0f14]/95 backdrop-blur-3xl shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Menu button - ALWAYS show for everyone (publisher + client) */}
            <button onClick={() => setShowSidebar(true)} className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm flex-shrink-0">
              <Menu size={20} className="sm:w-[22px] sm:h-[22px] text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-sm sm:text-lg font-bold truncate bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{bookTitle}</h1>
          </div>
          {/* Voice button - ALWAYS visible with proper mobile text */}
          <button onClick={onToggleVoice}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg hover:scale-105 transform flex-shrink-0 ml-2 ${
              isVoiceActive 
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl' 
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`} style={!isVoiceActive ? { color: 'var(--foreground)' } : {}}>
            <span className="hidden xs:inline sm:inline">{isVoiceActive ? '🎤 Voice' : 'Voice'}</span>
            <span className="xs:hidden sm:hidden">🎤</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
            {messages.length === 0 && (
              <div className="text-center py-8 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <MessageSquare size={28} className="sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--foreground)' }}>Let's Tell Your Story</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-lg max-w-md mx-auto px-4">
                  I'm here to help you create your autobiography. Just speak naturally, and I'll guide you through your journey.
                </p>
                <button onClick={onToggleVoice} className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm sm:text-lg shadow-xl hover:shadow-2xl transition-all">
                  Start Your Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mb-4 sm:mb-6 animate-fadeIn ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[90%] sm:max-w-[85%] group ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl rounded-br-md shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]' 
                    : 'bg-white/95 dark:bg-[#1a1a24]/95 rounded-3xl rounded-bl-md shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all hover:scale-[1.01] backdrop-blur-sm'
                } px-5 sm:px-7 py-4 sm:py-5`} style={msg.role === 'ai' ? { color: 'var(--foreground)' } : {}}>
                  <div className="text-[15px] sm:text-base leading-relaxed">
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  {msg.role === 'ai' && (
                    <button onClick={() => onSpeak(msg.text, i)} className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 sm:gap-2 transition-all font-medium opacity-0 group-hover:opacity-100">
                      <Volume2 size={13} className="sm:w-[15px] sm:h-[15px]" />
                      {speakingIndex === i ? '▶ Playing...' : '🔊 Read aloud'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 sm:gap-4 text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 bg-white dark:bg-[#2a2a2a] rounded-2xl px-5 py-4 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm sm:text-base font-medium">AI is thinking...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Premium Input Area - ChatGPT Style */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-2xl">
          <div className="max-w-4xl mx-auto">
            {isVoiceActive && (
              <div className="mb-4 sm:mb-5 text-center">
                {isListening ? (
                  <span className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-semibold shadow-xl animate-pulse">
                    <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white"></span>
                    </span>
                    🎤 Listening...
                  </span>
                ) : isSpeaking ? (
                  <span className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs sm:text-sm font-semibold shadow-xl">
                    <Volume2 size={15} className="sm:w-4 sm:h-4 animate-pulse" />
                    AI is speaking...
                  </span>
                ) : null}
              </div>
            )}

            <div className="flex items-end gap-2 sm:gap-3 bg-white dark:bg-[#2a2a2a] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all focus-within:border-blue-500 dark:focus-within:border-blue-500">
              <button onClick={onToggleListening} disabled={!isVoiceActive}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all flex-shrink-0 ${
                  isListening 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl scale-110' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                } disabled:opacity-40 disabled:cursor-not-allowed`}>
                {isListening ? <Mic size={20} className="sm:w-[24px] sm:h-[24px]" /> : <MicOff size={20} className="sm:w-[24px] sm:h-[24px]" />}
              </button>

              <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type your message or use voice..."
                style={{ color: 'var(--foreground)' }}
                className="flex-1 bg-transparent outline-none resize-none max-h-32 sm:max-h-40 text-[15px] sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                rows={1} disabled={isListening} />

              <button onClick={() => onSend(input)} disabled={!input.trim() || loading}
                className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-600 hover:from-indigo-700 hover:via-purple-600 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 flex-shrink-0">
                {loading ? <Loader2 size={20} className="sm:w-[24px] sm:h-[24px] animate-spin" /> : <Send size={20} className="sm:w-[24px] sm:h-[24px]" />}
              </button>
            </div>
            
            {/* Helpful hint */}
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
              {isVoiceActive ? '🎤 Voice mode active - Speak naturally' : '💡 Press Enter to send, Shift+Enter for new line'}
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
      )}
    </div>
  );
}
