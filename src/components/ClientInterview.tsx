"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Volume2, Loader2, Sparkles, Download, FileText, FileDown } from 'lucide-react';
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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 glass-ultra">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gradient-animate">{bookTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">with {clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isPublisher && wordCount > 0 && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover-lift bg-green-500 hover:bg-green-600 text-white"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
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
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover-lift ${
                isVoiceActive ? 'hdr-gradient-blue text-white neon-blue' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {isVoiceActive ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Voice Active</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span className="hidden sm:inline">Start Voice</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <span className="font-medium">{messages.length} messages</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 rounded-lg">
            <span className="font-medium">{wordCount.toLocaleString()} words</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 hdr-gradient-blue rounded-2xl flex items-center justify-center shadow-xl neon-blue">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Let's Tell Your Story</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                I'm here to interview you for your autobiography. Just like a real conversation - I'll ask questions, you share your story. Let's begin.
              </p>
              <button onClick={onToggleVoice}
                className="px-6 py-3 hdr-gradient-blue text-white rounded-xl hover:shadow-lg hover-lift-ultra neon-blue">
                Start Interview
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
                msg.role === 'user'
                  ? 'hdr-gradient-blue text-white shadow-lg neon-blue rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-tl-sm'
              }`}>
                <div className={`prose prose-sm sm:prose max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.role === 'ai' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => onSpeak(msg.text, i)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
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
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 glass-ultra">
        <div className="max-w-4xl mx-auto">
          {isVoiceActive && (
            <div className="mb-3 flex items-center justify-center gap-2 text-sm">
              {isListening ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="font-medium">Listening...</span>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Volume2 size={16} className="animate-pulse" />
                  <span className="font-medium">Speaking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                  <Sparkles size={16} />
                  <span className="font-medium">Voice mode active</span>
                </div>
              )}
            </div>
          )}

          <div className={`relative flex items-end gap-2 sm:gap-3 bg-white dark:bg-gray-800 border-2 rounded-2xl p-2 sm:p-3 transition-all duration-200 ${
            isListening ? 'border-red-500 shadow-lg' : 'border-gray-200 dark:border-gray-700 focus-within:border-blue-500'
          }`}>
            <button onClick={onToggleListening} disabled={!isVoiceActive}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isListening ? 'bg-red-500 text-white shadow-lg animate-pulse' :
                isVoiceActive ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600' :
                'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
              }`}>
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <textarea ref={textareaRef} value={input} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... tell me your story" : "Share your story here, or use voice..."}
              className="flex-1 bg-transparent outline-none py-3 px-2 resize-none max-h-32 text-sm sm:text-base"
              rows={1} disabled={isListening} />

            <button onClick={() => onSend(input)} disabled={!input.trim() || loading}
              className="p-3 hdr-gradient-blue text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover-lift transition-all duration-200 neon-blue">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
