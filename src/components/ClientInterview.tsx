"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Mic, MicOff, Send, Volume2, Loader2, Menu, X,
  Download, FileDown, FileText, BookOpen, Sparkles, Zap, MessageSquare
} from 'lucide-react';
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
  clientName, bookTitle, messages, input, loading,
  isListening, isSpeaking, isVoiceActive,
  wordCount, bookDraft, onSend, onInputChange,
  onToggleVoice, onToggleListening, onSpeak, speakingIndex,
  isPublisher = false
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const progress = Math.min((wordCount / 2000) * 100, 100);

  const handleExport = async (format: 'html' | 'docx' | 'markdown' | 'text') => {
    if (!bookDraft.trim()) { alert('No content to export yet.'); return; }
    try {
      if (format === 'html') await exportToPDF(bookTitle, clientName, bookDraft);
      else if (format === 'docx') await exportToDOCX(bookTitle, clientName, bookDraft);
      else if (format === 'markdown') await exportToMarkdown(bookTitle, clientName, bookDraft);
      else await exportToText(bookTitle, clientName, bookDraft);
      setExportOpen(false);
    } catch { alert('Export failed. Please try again.'); }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  // Close export on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(input); }
  };

  const tip = messages.length === 0
    ? 'Start Voice or type below to begin'
    : messages.length < 5
    ? 'Share specific details — names, places, emotions'
    : wordCount < 500
    ? 'Keep going! Every story matters'
    : 'Amazing progress! Your story is taking shape';

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">

          {/* Sidebar Header */}
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(91,91,214,0.3)' }}>
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-heading truncate" style={{ color: 'var(--fg)' }}>{bookTitle}</p>
              <p className="text-small truncate" style={{ color: 'var(--fg-muted)' }}>with {clientName}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="btn btn-ghost btn-icon flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Stats */}
            <div className="card p-4">
              <p className="text-label mb-3" style={{ color: 'var(--fg-muted)' }}>Progress</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Messages', value: messages.length },
                  { label: 'Words written', value: wordCount.toLocaleString() },
                  { label: 'Completion', value: `${Math.round(progress)}%` },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-small" style={{ color: 'var(--fg-muted)' }}>{s.label}</span>
                    <span className="text-small font-semibold" style={{ color: 'var(--fg)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-small mt-1.5" style={{ color: 'var(--fg-faint)' }}>
                  {wordCount < 2000 ? `${(2000 - wordCount).toLocaleString()} words to target` : '🎉 Target reached!'}
                </p>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-xl p-3.5" style={{
              background: 'var(--warning-subtle)',
              border: '1px solid rgba(217,119,6,0.2)'
            }}>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} style={{ color: 'var(--warning)' }} />
                <span className="text-label" style={{ color: 'var(--warning)' }}>Tip</span>
              </div>
              <p className="text-small" style={{ color: 'var(--fg-muted)' }}>{tip}</p>
            </div>

            {/* Export — Publisher Only */}
            {isPublisher && wordCount > 0 && (
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="btn btn-primary w-full"
                >
                  <Download size={14} />
                  Export Book
                </button>
                {exportOpen && (
                  <div className="dropdown absolute bottom-full left-0 right-0 mb-2 animate-scaleIn">
                    {[
                      { fmt: 'docx' as const, icon: FileDown, label: 'Word Document', sub: '.docx', color: '#5b5bd6' },
                      { fmt: 'html' as const, icon: FileText, label: 'HTML File', sub: '.html', color: '#dc2626' },
                      { fmt: 'markdown' as const, icon: FileText, label: 'Markdown', sub: '.md', color: '#7c3aed' },
                      { fmt: 'text' as const, icon: FileText, label: 'Plain Text', sub: '.txt', color: '#6b7280' },
                    ].map(({ fmt, icon: Icon, label, sub, color }) => (
                      <button key={fmt} onClick={() => handleExport(fmt)} className="dropdown-item">
                        <Icon size={14} style={{ color }} />
                        <div>
                          <p style={{ color: 'var(--fg)', fontWeight: 500 }}>{label}</p>
                          <p style={{ color: 'var(--fg-faint)', fontSize: '11px' }}>{sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon flex-shrink-0">
              <Menu size={17} />
            </button>
            <span className="text-heading truncate" style={{ color: 'var(--fg)' }}>{bookTitle}</span>
          </div>

          <button
            onClick={onToggleVoice}
            className="btn flex-shrink-0"
            style={isVoiceActive ? {
              background: 'var(--accent)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(91,91,214,0.3)'
            } : {
              background: 'var(--bg-subtle)',
              color: 'var(--fg)',
              border: '1px solid var(--border)'
            }}
          >
            {isVoiceActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                <span className="hidden sm:inline text-sm">Voice On</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span className="hidden sm:inline text-sm">Start Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-subtle)' }}>
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

            {messages.length === 0 && (
              <div className="text-center py-16 animate-fadeUp">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--accent)', boxShadow: '0 8px 24px rgba(91,91,214,0.3)' }}>
                  <MessageSquare size={28} className="text-white" />
                </div>
                <h2 className="text-title mb-2" style={{ color: 'var(--fg)' }}>Let's Tell Your Story</h2>
                <p className="text-body mb-8 max-w-xs mx-auto" style={{ color: 'var(--fg-muted)' }}>
                  I'll guide you through your journey with thoughtful questions. Just speak naturally.
                </p>
                <button onClick={onToggleVoice} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                  <Sparkles size={16} />
                  Start Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex animate-fadeUp ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bubble-user">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="bubble-ai group">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                    <button
                      onClick={() => onSpeak(msg.text, i)}
                      className="mt-2.5 flex items-center gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--fg-faint)' }}
                    >
                      <Volume2 size={11} />
                      {speakingIndex === i ? 'Playing...' : 'Read aloud'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bubble-ai flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="dot" style={{ background: 'var(--accent)' }} />
                    <div className="dot" style={{ background: '#a78bfa' }} />
                    <div className="dot" style={{ background: '#ec4899' }} />
                  </div>
                  <span className="text-small" style={{ color: 'var(--fg-muted)' }}>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="max-w-2xl mx-auto">

            {/* Voice Status Pill */}
            {isVoiceActive && (isListening || isSpeaking) && (
              <div className="flex justify-center mb-3">
                {isListening ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: '#ef4444' }}>
                    <span className="voice-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    Listening...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--accent)' }}>
                    <Volume2 size={12} className="animate-pulse-soft" />
                    Speaking...
                  </span>
                )}
              </div>
            )}

            {/* Input Box */}
            <div className="flex items-end gap-2 p-3 rounded-xl border-2 transition-all"
              style={{
                background: 'var(--bg)',
                borderColor: isListening ? '#ef4444' : 'var(--border)',
                boxShadow: isListening ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
              }}>
              <button
                onClick={onToggleListening}
                disabled={!isVoiceActive}
                className="btn btn-icon flex-shrink-0 transition-all"
                style={isListening ? {
                  background: '#ef4444',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
                } : {
                  background: 'var(--bg-subtle)',
                  color: 'var(--fg-muted)',
                  border: '1px solid var(--border)'
                }}
              >
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Type your message...'}
                className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
                style={{ color: 'var(--fg)', maxHeight: '140px' }}
                rows={1}
                disabled={isListening}
              />

              <button
                onClick={() => onSend(input)}
                disabled={!input.trim() || loading}
                className="btn btn-icon flex-shrink-0"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            <p className="text-center text-xs mt-2" style={{ color: 'var(--fg-faint)' }}>
              {isVoiceActive ? 'Voice mode active — speak naturally' : 'Enter to send · Shift+Enter for new line'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
