"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Volume2, Loader2, Menu, X, MessageSquare, Download, FileDown, FileText } from 'lucide-react';
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
    <div className="flex h-screen bg-white dark:bg-[#212121]">
      {/* Sidebar - ChatGPT Style */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#f7f7f8] dark:bg-[#171717] border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">{bookTitle}</h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">with {clientName}</p>
          </div>

          {/* Stats */}
          <div className="p-4 space-y-3">
            <div className="bg-white dark:bg-[#2f2f2f] rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Messages</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Words</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{wordCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-[#2f2f2f] rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Book Progress</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {wordCount < 2000 ? `${2000 - wordCount} words to go` : '✓ Target reached'}
              </p>
            </div>

            {/* Export - Publisher Only */}
            {isPublisher && wordCount > 0 && (
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Download size={16} />
                  Export Book
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#2f2f2f] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button onClick={() => handleExport('docx')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileDown size={16} /> DOCX
                    </button>
                    <button onClick={() => handleExport('html')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText size={16} /> HTML
                    </button>
                    <button onClick={() => handleExport('markdown')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText size={16} /> Markdown
                    </button>
                    <button onClick={() => handleExport('text')} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText size={16} /> Text
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
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-[#212121]">
          <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-sm font-medium text-gray-900 dark:text-white">{bookTitle}</h1>
          </div>
          <button onClick={onToggleVoice}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isVoiceActive ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {isVoiceActive ? '🎤 Voice On' : 'Start Voice'}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Let's Tell Your Story</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start your autobiography interview</p>
                <button onClick={onToggleVoice} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  Start Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mb-6 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' : 'bg-gray-100 dark:bg-[#2f2f2f] text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'} px-4 py-3`}>
                  <ReactMarkdown className="text-sm leading-relaxed">{msg.text}</ReactMarkdown>
                  {msg.role === 'ai' && (
                    <button onClick={() => onSpeak(msg.text, i)} className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                      <Volume2 size={12} />
                      {speakingIndex === i ? 'Playing...' : 'Read aloud'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#212121]">
          <div className="max-w-3xl mx-auto">
            {isVoiceActive && (
              <div className="mb-3 text-center">
                {isListening ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Listening...
                  </span>
                ) : isSpeaking ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                    <Volume2 size={14} />
                    Speaking...
                  </span>
                ) : null}
              </div>
            )}

            <div className="flex items-end gap-2 bg-gray-100 dark:bg-[#2f2f2f] rounded-2xl p-2">
              <button onClick={onToggleListening} disabled={!isVoiceActive}
                className={`p-2 rounded-lg ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'} disabled:opacity-50`}>
                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-transparent outline-none resize-none max-h-32 text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
                rows={1} disabled={isListening} />

              <button onClick={() => onSend(input)} disabled={!input.trim() || loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
      )}
    </div>
  );
}
