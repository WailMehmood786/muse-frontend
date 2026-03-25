"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Mic, MicOff, Send, Volume2, Loader2, Menu, X, Download, FileText, BookOpen, Sparkles, MessageSquare, Save } from 'lucide-react';
import { exportToPDF, exportToMarkdown, exportToText, exportToDOCX } from '@/utils/pdfExport';
import { VoiceAgent } from '@/utils/voiceAgent';
import toast from 'react-hot-toast';

type Message = { role: 'user' | 'ai'; text: string };

interface Client {
  id: string;
  name: string;
  bookTitle: string;
  sport?: string;
  messages?: Message[];
  bookDraft?: string;
  wordCount?: number;
  status?: string;
}

interface Props {
  client: Client;
  onUpdate: (updates: Partial<Client>) => void;
}

export default function ClientInterview({ client, onUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>(client.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [bookDraft, setBookDraft] = useState(client.bookDraft || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceAgentRef = useRef<VoiceAgent | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://muse-backend-production-29cd.up.railway.app';
  const wordCount = bookDraft.split(/\s+/).filter(w => w.length > 0).length;
  const progress = Math.min((wordCount / 2000) * 100, 100);

  // Auto-save function
  const autoSave = async () => {
    if (saving) return;
    setSaving(true);
    
    await onUpdate({
      messages,
      bookDraft,
      wordCount,
      status: wordCount >= 2000 ? 'completed' : 'active'
    });
    
    setSaving(false);
  };

  // Save when messages or draft changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length > 0 || bookDraft) {
        autoSave();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [messages, bookDraft]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  // Voice Agent Setup
  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent({
      onListeningChange: setIsListening,
      onSpeakingChange: setIsSpeaking,
      onTranscript: setInput,
      onFinalTranscript: (text) => handleSend(text),
      onError: (error) => {
        console.error('Voice error:', error);
        toast.error('Voice recognition error. Please type your message.');
      }
    });

    voiceAgentRef.current.setSilenceMs(2000);
    voiceAgentRef.current.setLanguage('en-US');
    voiceAgentRef.current.setVoice({ rate: 0.92, pitch: 1.05, volume: 1.0 });

    return () => {
      voiceAgentRef.current?.stop();
    };
  }, []);

  const getWelcomeMessage = () => {
    return `Hey ${client.name}, thanks for sitting down with me. I'd love to hear your story. Let's start from the beginning - tell me about where you grew up.`;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Stop listening while processing
    if (voiceAgentRef.current && isListening) {
      voiceAgentRef.current.stopListening();
    }

    const userMessage: Message = { role: 'user', text: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Update draft with user message
    const updatedDraft = bookDraft 
      ? bookDraft + `\n\n**${client.name}:** ${textToSend}`
      : `**${client.name}:** ${textToSend}`;
    setBookDraft(updatedDraft);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          sport: client.sport || 'baseball',
          clientId: client.id
        })
      });

      const data = await res.json();
      const aiReply = data.reply || "That's interesting. Tell me more about that.";

      const aiMessage: Message = { role: 'ai', text: aiReply };
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Update draft with AI response
      const finalDraft = updatedDraft + `\n\n**Interviewer:** ${aiReply}`;
      setBookDraft(finalDraft);

      // Speak AI response if voice active
      if (voiceAgentRef.current?.isVoiceActive()) {
        voiceAgentRef.current.enqueueSpeak(aiReply);
        voiceAgentRef.current.completeProcessing();
      }

    } catch (error) {
      console.error('Send error:', error);
      const errorMsg = "I'm having trouble connecting. Could you repeat that?";
      setMessages([...newMessages, { role: 'ai', text: errorMsg }]);
      toast.error('Connection issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceAgent = () => {
    if (isVoiceActive) {
      voiceAgentRef.current?.stop();
      setIsVoiceActive(false);
      toast.success('Voice mode disabled');
    } else {
      if (messages.length === 0) {
        const welcomeMsg = getWelcomeMessage();
        voiceAgentRef.current?.start(welcomeMsg);
        setMessages([{ role: 'ai', text: welcomeMsg }]);
        setBookDraft(`**Interviewer:** ${welcomeMsg}`);
      } else {
        voiceAgentRef.current?.start();
      }
      setIsVoiceActive(true);
      toast.success('Voice mode enabled - speak naturally');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceAgentRef.current?.stopListening();
    } else {
      voiceAgentRef.current?.startListening();
    }
  };

  const handleSpeak = (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      voiceAgentRef.current?.speak(text, () => setSpeakingIndex(null));
    }
  };

  const handleExport = async (format: 'html' | 'docx' | 'markdown' | 'text') => {
    if (!bookDraft.trim()) {
      toast.error('No content to export yet. Start your interview first!');
      return;
    }
    
    try {
      if (format === 'html') await exportToPDF(client.bookTitle, client.name, bookDraft);
      else if (format === 'docx') await exportToDOCX(client.bookTitle, client.name, bookDraft);
      else if (format === 'markdown') await exportToMarkdown(client.bookTitle, client.name, bookDraft);
      else await exportToText(client.bookTitle, client.name, bookDraft);
      
      setExportOpen(false);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{client.bookTitle}</p>
                <p className="text-xs text-gray-500 truncate">with {client.name}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Stats */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Interview Stats</p>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="text-sm font-bold">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Words</span>
                <span className="text-sm font-bold">{wordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-bold">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-600">Book Progress</span>
                <span className="font-bold text-indigo-600">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {wordCount < 2000 ? `${(2000 - wordCount).toLocaleString()} words to go` : '🎉 Target reached!'}
              </p>
            </div>

            {/* Save Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Auto-save</span>
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
            </div>

            {/* Export Button */}
            {wordCount > 0 && (
              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  <Download size={14} className="inline mr-2" />
                  Export Book
                </button>
                
                {exportOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                    {[
                      { fmt: 'docx', label: 'Microsoft Word', icon: '📄' },
                      { fmt: 'html', label: 'PDF', icon: '📑' },
                      { fmt: 'markdown', label: 'Markdown', icon: '📝' },
                      { fmt: 'text', label: 'Plain Text', icon: '📃' }
                    ].map(({ fmt, label, icon }) => (
                      <button
                        key={fmt}
                        onClick={() => handleExport(fmt as any)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <span>{icon}</span>
                        <span className="text-sm">{label}</span>
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu size={18} />
          </button>
          
          <button
            onClick={toggleVoiceAgent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isVoiceActive
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {isVoiceActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Voice On
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Start Voice
              </>
            )}
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Let's Tell Your Story</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                  I'll guide you through your journey with thoughtful questions. Just speak or type naturally.
                </p>
                <button
                  onClick={toggleVoiceAgent}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <Sparkles size={18} className="inline mr-2" />
                  Start Interview
                </button>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex animate-fadeUp ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="max-w-[80%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 group">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                    <button
                      onClick={() => handleSpeak(msg.text, idx)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Volume2 size={12} />
                      {speakingIndex === idx ? 'Playing...' : 'Read aloud'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            {/* Voice Status */}
            {isVoiceActive && (isListening || isSpeaking) && (
              <div className="flex justify-center mb-3">
                {isListening ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-red-500 text-white">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Listening...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                    <Volume2 size={13} className="animate-pulse" />
                    Speaking...
                  </span>
                )}
              </div>
            )}

            {/* Input Box */}
            <div className={`flex items-end gap-2 p-3 rounded-2xl border-2 transition-all bg-white dark:bg-gray-800 ${
              isListening ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <button
                onClick={toggleListening}
                disabled={!isVoiceActive}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : 'Type your message or use voice...'}
                className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
                rows={1}
                disabled={isListening}
              />

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-2">
              {isVoiceActive ? '🎤 Voice mode active — speak naturally' : 'Enter to send · Shift+Enter for new line'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}