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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-[#0a0a0a] dark:to-[#1a1a2e]">
      {/* Premium Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BookOpen size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">{bookTitle}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">with {clientName}</p>
                </div>
              </div>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Interview Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                Interview Progress
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Messages</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Words Written</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{wordCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Completion</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Book Progress</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 shadow-lg" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {wordCount < 2000 ? `${(2000 - wordCount).toLocaleString()} words remaining` : '🎉 Target achieved! Keep going!'}
              </p>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Zap size={14} className="text-amber-600" />
                Quick Tip
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
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
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <Download size={16} />
                  Export Your Book
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <button onClick={() => handleExport('docx')} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                      <FileDown size={16} className="text-blue-600" /> 
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
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">{bookTitle}</h1>
          </div>
          <button onClick={onToggleVoice}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              isVoiceActive 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            {isVoiceActive ? '🎤 Voice Active' : 'Start Voice Interview'}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  <MessageSquare size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Let's Tell Your Story</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
                  I'm here to help you create your autobiography. Just speak naturally, and I'll guide you through your journey.
                </p>
                <button onClick={onToggleVoice} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all">
                  Start Your Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mb-8 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-3xl rounded-tr-md shadow-lg' 
                    : 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-3xl rounded-tl-md shadow-lg border border-gray-200 dark:border-gray-800'
                } px-6 py-4`}>
                  <div className="text-[15px] leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  {msg.role === 'ai' && (
                    <button onClick={() => onSpeak(msg.text, i)} className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors">
                      <Volume2 size={14} />
                      {speakingIndex === i ? 'Playing...' : 'Read aloud'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-8">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium">AI is thinking...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Premium Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            {isVoiceActive && (
              <div className="mb-4 text-center">
                {isListening ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium shadow-lg">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Listening to your story...
                  </span>
                ) : isSpeaking ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium shadow-lg">
                    <Volume2 size={16} className="animate-pulse" />
                    AI is speaking...
                  </span>
                ) : null}
              </div>
            )}

            <div className="flex items-end gap-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-lg">
              <button onClick={onToggleListening} disabled={!isVoiceActive}
                className={`p-3 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isListening ? <Mic size={22} /> : <MicOff size={22} />}
              </button>

              <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type your message or use voice..."
                className="flex-1 bg-transparent outline-none resize-none max-h-32 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-500"
                rows={1} disabled={isListening} />

              <button onClick={() => onSend(input)} disabled={!input.trim() || loading}
                className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg">
                {loading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
              </button>
            </div>
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
