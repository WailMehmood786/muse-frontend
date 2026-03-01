"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Send, Sparkles, LogOut, Loader2, BookOpen, Plus, MessageSquare, 
  FileDown, FileJson, KeyRound, Trash2, LayoutPanelLeft, PenLine,
  Mic, MicOff, Eraser, Sun, Moon, Maximize2, Minimize2, Volume2, VolumeX, Menu, X, ChevronRight,
  AlertTriangle, Telescope, Sparkle, Settings
} from 'lucide-react';

const GoogleLoginButton = ({ onSuccess }: { onSuccess: (token: string) => void }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => alert('Google Login Failed'),
  });

  return (
    <button onClick={() => login()} className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] p-3 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.98]">
      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Continue with Google
    </button>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [bookDraft, setBookDraft] = useState<string>("");
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<{name: string, id: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [zenMode, setZenMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [writingMode, setWritingMode] = useState('Creative');
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Naya ref text box ke liye

  useEffect(() => { 
    const timer = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); 
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user_muse');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      loadSessions(parsed.id);
    }
  }, []);

  const loadSessions = async (userId: string) => {
    try {
      const res = await axios.get(`https://muse-backend-production-29cd.up.railway.app/api/sessions/${userId}`);
      setSessions(res.data);
    } catch (err) { console.error("Sessions load fail"); }
  };

  const loadSessionHistory = async (sessionId: string) => {
    setLoading(true);
    setIsMobileMenuOpen(false); 
    try {
      const res = await axios.get(`https://muse-backend-production-29cd.up.railway.app/api/history/${sessionId}`);
      setCurrentSessionId(sessionId);
      
      let reconstructedDraft = "";
      const history = res.data.map((h: any) => {
        let text = h.content;
        if (h.role === 'ai') {
          const draftMatch = text.match(/\[START_DRAFT\]([\s\S]*?)\[END_DRAFT\]/i);
          if (draftMatch) {
            reconstructedDraft += "\n\n" + draftMatch[1].trim();
            text = text.replace(/\[START_DRAFT\][\s\S]*?\[END_DRAFT\]/i, '').trim();
          }
        }
        return { role: h.role === 'ai' ? 'ai' : 'user', text };
      });

      setMessages(history);
      if (reconstructedDraft) {
        setBookDraft(reconstructedDraft.trim());
      } else {
        setBookDraft(""); 
      }
    } catch (err) { console.error("History load fail"); }
    setLoading(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', text: textToSend } as const];
    setMessages(newMsgs);
    
    // Yahan text input clear ho raha hai aur size wapas chota ho raha hai
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
    }
    
    setLoading(true);

    try {
      const res = await axios.post('https://muse-backend-production-29cd.up.railway.app/api/chat', {
        message: textToSend,
        userId: user ? user.id : null,
        history: messages,
        sessionId: currentSessionId,
        mode: writingMode
      });
      
      let aiReply = res.data.reply;
      aiReply = aiReply.replace(/\[START_DRAFT\]/gi, '').replace(/\[END_DRAFT\]/gi, '').trim();

      setMessages([...newMsgs, { role: 'ai', text: aiReply }]);
      
      // AUTO-ADD FEATURE (Perfect for book writing)
      const newDraftContent = `**User:** ${textToSend}\n\n**Muse:** ${aiReply}`;
      setBookDraft(prev => prev ? prev + "\n\n---\n\n" + newDraftContent : newDraftContent);

      if (!currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        if (user) loadSessions(user.id);
      }
    } catch (err: any) { 
      const errorMsg = err.response?.data?.details || err.response?.data?.error || "Connection Failed";
      alert(`API Error: ${errorMsg}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDigDeeper = () => {
      handleSend("Please ask me a specific, highly thought-provoking question to dig deeper into the core emotions and details of what I just shared.");
  };

  const deleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation(); e.preventDefault();
    if (!confirm("Delete permanently?")) return;
    try {
      await axios.delete(`https://muse-backend-production-29cd.up.railway.app/api/sessions/${sid}`);
      if (user) loadSessions(user.id);
      if (currentSessionId === sid) startNewChat();
    } catch (err) { alert("Delete failed"); }
  };

  const handleSpeak = (text: string, index: number) => {
    if (!window.speechSynthesis) return alert("Browser not supported");
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    if (isListening) { setIsListening(false); recognition.stop(); }
    else {
      setIsListening(true); recognition.start();
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => {
           const newVal = prev + (prev ? " " : "") + transcript;
           // Automatically resize text box when voice finishes
           if (textareaRef.current) {
             textareaRef.current.style.height = 'auto';
             textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
           }
           return newVal;
        });
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setBookDraft("");
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsMobileMenuOpen(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const handleAuth = async () => {
    try {
      if (isReset) {
        await axios.post('https://muse-backend-production-29cd.up.railway.app/api/auth/reset-password', { email: authForm.email, newPassword: authForm.password });
        alert("Success! Login now.");
        setIsReset(false); setIsLogin(true);
        return;
      }
      const path = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await axios.post(`https://muse-backend-production-29cd.up.railway.app${path}`, authForm);
      const data = { name: res.data.name, id: res.data.id };
      setUser(data);
      localStorage.setItem('user_muse', JSON.stringify(data));
      loadSessions(data.id);
      setShowAuth(false);
    } catch (err) { alert("Authentication failed."); }
  };

  const handleGoogleAuth = async (accessToken: string) => {
    try {
      const res = await axios.post('https://muse-backend-production-29cd.up.railway.app/api/auth/google', { token: accessToken });
      const data = { name: res.data.name, id: res.data.id };
      setUser(data);
      localStorage.setItem('user_muse', JSON.stringify(data));
      loadSessions(data.id);
      setShowAuth(false);
    } catch (err) { alert("Google Authentication failed."); }
  };

  const downloadTXT = () => {
    if(!bookDraft) return alert("Manuscript is empty.");
    const blob = new Blob([bookDraft], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `Manuscript_${Date.now()}.txt`);
  };

  const downloadPDF = () => {
    if(!bookDraft) return alert("Manuscript is empty.");
    const doc = new jsPDF();
    doc.setFont("times", "bold").text("My Manuscript", 20, 20);
    doc.setFont("times", "normal").setFontSize(12);
    const split = doc.splitTextToSize(bookDraft.replace(/[#*]/g, ''), 170);
    doc.text(split, 20, 30);
    doc.save(`Manuscript_${Date.now()}.pdf`);
  };

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#ffffff]',
    sidebar: theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f9f9fb]',
    text: theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
    border: theme === 'dark' ? 'border-[#222]' : 'border-gray-200/60',
    inputBg: theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white',
  };

  return (
    <div className={`flex h-screen w-full ${themeClasses.bg} ${themeClasses.text} font-sans transition-colors duration-300 overflow-hidden relative selection:bg-blue-500/20`}>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Modern, Slim Sidebar */}
      {!zenMode && (
        <aside className={`fixed md:relative z-[70] h-full w-[260px] ${themeClasses.sidebar} border-r ${themeClasses.border} flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 shrink-0`}>
          
          <div className="p-5 flex items-center justify-between border-b border-transparent">
            <div className="flex items-center gap-2.5 select-none">
              <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center">
                  <PenLine size={16} className="text-white" />
              </div>
              <h1 className="font-bold text-[17px] tracking-tight text-gray-900 dark:text-white">Muse <span className="text-gray-400 font-normal">AI</span></h1>
            </div>
            <button className="md:hidden text-gray-500 hover:text-gray-800 dark:hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={18}/>
            </button>
          </div>

          <div className="px-3 pt-2">
            <button onClick={startNewChat} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 w-full font-medium text-[13px] shadow-sm active:scale-95">
              <Plus size={16} /> Start Writing
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-0.5 mt-4 px-3 custom-scrollbar">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider px-2 mb-2 select-none">Recent Drafts</p>
            {sessions.map((s, i) => (
              <div key={i} className="group relative flex items-center">
                <button
                  onClick={() => loadSessionHistory(s.sessionId)}
                  className={`flex items-center gap-2.5 p-2 w-full rounded-md text-left text-[13px] transition-all duration-200 ${currentSessionId === s.sessionId ? 'bg-gray-200/50 dark:bg-white/10 text-gray-900 dark:text-white font-medium' : `hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400`}`}
                >
                  <MessageSquare size={14} className={currentSessionId === s.sessionId ? "text-gray-900 dark:text-gray-300" : "text-gray-400"} />
                  <span className="truncate flex-1">{s.content}</span>
                </button>
                <button onClick={(e) => deleteSession(e, s.sessionId)} className="absolute right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-gray-100 dark:bg-[#1a1a1a] rounded shadow-sm">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {!user && sessions.length === 0 && (
                <div className="p-4 mt-2 bg-transparent text-center select-none">
                    <p className="text-[12px] text-gray-400">Sign in to sync your drafts.</p>
                </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200/60 dark:border-[#222]">
              <div className="flex gap-2">
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`flex items-center justify-center p-2 rounded-lg border ${themeClasses.border} bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors`} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={16} className="text-gray-400" /> : <Moon size={16} className="text-gray-600" />}
                </button>
                {user ? (
                    <button onClick={() => {localStorage.clear(); window.location.reload();}} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${themeClasses.border} bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#222] text-gray-600 dark:text-gray-300 text-[13px] font-medium transition-colors`} title="Logout">
                        <LogOut size={14} className="text-gray-400"/> Logout
                    </button>
                ) : (
                    <button onClick={() => {setShowAuth(true); setIsMobileMenuOpen(false);}} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300 text-[13px] font-medium transition-colors`}>
                        Sign In
                    </button>
                )}
              </div>
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative ${isDraftOpen ? 'hidden md:flex md:w-[50%]' : 'flex w-full'}`}>
        
        {/* Sleek Topbar */}
        <header className={`h-14 flex-shrink-0 px-4 md:px-6 border-b ${themeClasses.border} flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-30`}>
          <div className="flex items-center gap-3">
            {!zenMode && (
              <button className="md:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={18} />
              </button>
            )}
            <button onClick={() => setZenMode(!zenMode)} className={`hidden md:flex p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition`} title="Focus Mode">
                {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] px-2 py-1 rounded-md">
              <Settings size={12} className="text-gray-400" />
              <select
                  value={writingMode}
                  onChange={(e) => setWritingMode(e.target.value)}
                  className={`bg-transparent text-[12px] font-medium rounded outline-none cursor-pointer text-gray-600 dark:text-gray-300`}
              >
                  <option value="Creative" className="bg-white dark:bg-[#111]">Creative</option>
                  <option value="Professional" className="bg-white dark:bg-[#111]">Professional</option>
                  <option value="Memoir" className="bg-white dark:bg-[#111]">Memoir</option>
              </select>
            </div>
          </div>

          <button onClick={() => setIsDraftOpen(!isDraftOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors font-medium text-[12px] ${isDraftOpen ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#222]'}`}>
            <BookOpen size={14} />
            <span>Manuscript</span>
          </button>
        </header>

        {/* Clean Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-40 scroll-smooth custom-scrollbar relative">
          
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center select-none max-w-lg mx-auto px-4 animate-in fade-in duration-500">
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] p-4 rounded-xl mb-6 shadow-sm">
                  <Sparkles size={24} className="text-blue-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">Craft your story.</h2>
              <p className="text-[14px] md:text-[15px] text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Talk to me naturally. Everything we discuss is automatically structured and added to your manuscript.
              </p>
              
              <div className="w-full flex justify-center">
                <button onClick={() => handleSend("Let's start. Ask me the first question about my background.")} className={`px-5 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-all font-medium text-[14px] shadow-sm active:scale-95 flex items-center gap-2`}>
                  Start Interview <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          )}
          
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                <div className={`p-4 md:p-5 max-w-[85%] leading-relaxed text-[14px] md:text-[15px] ${
                  m.role === 'user' 
                    ? 'bg-[#f0f0f0] dark:bg-[#222] text-gray-900 dark:text-gray-100 rounded-2xl rounded-tr-sm' 
                    : `bg-transparent text-gray-800 dark:text-gray-200 w-full`
                }`}>
                  
                  <div className={`prose prose-sm md:prose-base max-w-none ${m.role === 'user' ? 'dark:prose-invert' : 'prose-blue dark:prose-invert'}`}>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  
                  {m.role === 'ai' && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => handleSpeak(m.text, i)}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        {speakingIndex === i ? (
                          <><VolumeX size={14}/> Stop</>
                        ) : (
                          <><Volume2 size={14}/> Read</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-gray-400 text-[13px] font-medium ml-4 p-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              </div>
            )}
          </div>
          
          <div className="h-32 w-full shrink-0"></div>
          <div ref={scrollRef} />
        </main>

        {/* Dynamic & Resizing Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] z-40">
          <div className="max-w-3xl mx-auto">
            
            {messages.length > 0 && !loading && (
                <div className="flex justify-center mb-3">
                    <button onClick={handleDigDeeper} className="flex items-center gap-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-[12px] font-medium px-4 py-2 rounded-full transition-all shadow-sm">
                        <Telescope size={14} className="text-gray-400"/> Ask me more
                    </button>
                </div>
            )}

            {!user && messages.length > 0 && (
              <div className="mb-2 flex items-center justify-center gap-1.5 text-[12px] text-gray-500 font-medium">
                <AlertTriangle size={14} className="text-yellow-500" /> Guest session. <span onClick={() => setShowAuth(true)} className="underline cursor-pointer hover:text-gray-800 dark:hover:text-white">Sign in to save.</span>
              </div>
            )}

            <div className={`relative flex items-end gap-2 ${themeClasses.inputBg} border ${themeClasses.border} rounded-xl p-1.5 shadow-sm focus-within:border-gray-400 dark:focus-within:border-gray-600 transition-colors`}>
              <button
                onClick={toggleListening}
                className={`p-2.5 rounded-lg transition-colors shrink-0 ${isListening ? 'bg-red-50 dark:bg-red-500/10 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]'}`}
              >
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              
              {/* AUTO RESIZING TEXTAREA FOR BOOK WRITING */}
              <textarea
                ref={textareaRef}
                className={`flex-1 bg-transparent border-none outline-none py-2.5 px-1 text-[14px] md:text-[15px] resize-none custom-scrollbar text-gray-900 dark:text-gray-100 placeholder:text-gray-400`}
                placeholder="Share your story or answer the interview question in detail..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Text box ko dynamically adjust karna 
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 250)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                style={{ minHeight: '40px', maxHeight: '250px' }}
              />

              <button onClick={() => handleSend()} className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95 shrink-0">
                <Send size={16}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Manuscript Panel */}
      {isDraftOpen && (
        <div className={`absolute inset-0 md:relative md:inset-auto z-[60] w-full md:w-[45%] flex flex-col bg-white dark:bg-[#0a0a0a] border-l ${themeClasses.border} shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300 shrink-0`}>
          <header className={`h-14 px-4 md:px-6 border-b ${themeClasses.border} flex justify-between items-center bg-transparent`}>
            <div className="flex items-center gap-2">
              <button className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] rounded-md transition" onClick={() => setIsDraftOpen(false)}>
                <ChevronRight size={18} />
              </button>
              <h2 className="font-semibold text-[14px] text-gray-800 dark:text-gray-200 flex items-center gap-2">
                Manuscript
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={downloadPDF} className="px-2 py-1 text-[12px] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] rounded transition-colors font-medium">PDF</button>
              <button onClick={downloadTXT} className="px-2 py-1 text-[12px] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#222] rounded transition-colors font-medium">TXT</button>
              <span className="text-gray-300 dark:text-gray-700 mx-1">|</span>
              <button onClick={() => { if(confirm("Clear the entire manuscript?")) setBookDraft(""); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={14} /></button>
            </div>
          </header>
          
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0a0a]">
              <textarea
                className={`w-full h-full bg-transparent outline-none resize-none font-serif text-[16px] md:text-[18px] leading-[1.8] text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-[#333]`}
                placeholder="Your drafted content will appear here..."
                value={bookDraft}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBookDraft(e.target.value)}
              />
          </div>
        </div>
      )}

      {/* Clean Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm transition-all">
           <div className="bg-white dark:bg-[#111] p-8 rounded-2xl w-full max-w-[400px] border border-gray-200/60 dark:border-[#222] shadow-2xl relative animate-in zoom-in-95 duration-200">
           
           <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-md"><X size={16}/></button>

           <div className="mb-6">
             <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">
                 {isReset ? 'Reset Password' : isLogin ? 'Welcome back' : 'Create an account'}
             </h2>
             <p className="text-[13px] text-gray-500">Securely sync your workspace.</p>
           </div>

           <div className="space-y-3">
             {!isLogin && !isReset && <input placeholder="Full Name" className="w-full p-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg outline-none focus:border-gray-400 transition-colors text-[14px]" onChange={(e) => setAuthForm({...authForm, name: e.target.value})}/>}
             <input placeholder="Email Address" className="w-full p-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg outline-none focus:border-gray-400 transition-colors text-[14px]" onChange={(e) => setAuthForm({...authForm, email: e.target.value})}/>
             <input type="password" placeholder="Password" className="w-full p-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg outline-none focus:border-gray-400 transition-colors text-[14px]" onChange={(e) => setAuthForm({...authForm, password: e.target.value})}/>
             
             <button onClick={handleAuth} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 p-3 rounded-lg font-medium text-[14px] mt-2 transition-all active:scale-[0.98]">
                {isLogin ? "Sign In" : "Continue"}
             </button>
             
             <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-[#333]"></div></div>
                <div className="relative flex justify-center"><span className="bg-white dark:bg-[#111] px-3 text-[11px] font-medium text-gray-400">OR</span></div>
             </div>
             
             <GoogleOAuthProvider clientId="691831191491-8dff26vujkmstq9do9sr7n32o6ghmmam.apps.googleusercontent.com">
                <GoogleLoginButton onSuccess={handleGoogleAuth} />
             </GoogleOAuthProvider>

             <p onClick={() => setIsLogin(!isLogin)} className="text-center text-[13px] text-gray-500 hover:text-gray-800 dark:hover:text-white mt-4 cursor-pointer transition-colors">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
             </p>
           </div>
         </div>
       </div>
      )}
    </div>
  );
}