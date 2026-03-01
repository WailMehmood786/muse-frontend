"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Send, Sparkles, LogOut, Loader2, UserCircle,
  BookOpen, Plus, MessageSquare, FileDown,
  FileJson, KeyRound, Trash2, LayoutPanelLeft, PenLine,
  Mic, MicOff, Eraser, Type, Zap, Sun, Moon, Maximize2, Minimize2, Telescope,
  Volume2, VolumeX, AlertTriangle, Menu, X // <-- Menu aur X icons add kiye hain
} from 'lucide-react';

// --- CUSTOM GOOGLE LOGIN BUTTON COMPONENT ---
const GoogleLoginButton = ({ onSuccess }: { onSuccess: (token: string) => void }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => alert('Google Login Failed'),
  });

  return (
    <button onClick={() => login()} className="w-full bg-white dark:bg-[#0d1117] border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 p-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3 transition active:scale-95">
      <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // <-- Mobile sidebar state
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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
      const res = await axios.get(`https://muse-backend-qy5z.onrender.com/api/sessions/${userId}`);
      setSessions(res.data);
    } catch (err) { console.error("Sessions load fail"); }
  };

  const loadSessionHistory = async (sessionId: string) => {
    setLoading(true);
    setIsSidebarOpen(false); // <-- Mobile par session load hone ke baad sidebar band ho jaye
    try {
      const res = await axios.get(`https://muse-backend-qy5z.onrender.com/api/history/${sessionId}`);
      setCurrentSessionId(sessionId);
      
      let reconstructedDraft = "";
      const history = res.data.map((h: any) => {
        let text = h.content;
        if (h.role === 'ai') {
          const draftMatch = text.match(/\[START_DRAFT\]([\s\S]*?)\[END_DRAFT\]/);
          if (draftMatch) {
            reconstructedDraft += "\n\n" + draftMatch[1].trim();
            text = text.replace(/\[START_DRAFT\][\s\S]*?\[END_DRAFT\]/, '').trim();
          }
        }
        return { role: h.role === 'ai' ? 'ai' : 'user', text };
      });

      setMessages(history);
      if (reconstructedDraft) {
        setBookDraft(reconstructedDraft.trim());
      }
    } catch (err) { console.error("History load fail"); }
    setLoading(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', text: textToSend } as const];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('https://muse-backend-qy5z.onrender.com/api/chat', {
        message: textToSend,
        userId: user ? user.id : null,
        history: messages,
        sessionId: currentSessionId,
        mode: writingMode
      });
      
      let aiReply = res.data.reply;
      let extractedDraft = "";

      const draftMatch = aiReply.match(/\[START_DRAFT\]([\s\S]*?)\[END_DRAFT\]/);
      if (draftMatch) {
        extractedDraft = draftMatch[1].trim();
        aiReply = aiReply.replace(/\[START_DRAFT\][\s\S]*?\[END_DRAFT\]/, '').trim();
      }

      setMessages([...newMsgs, { role: 'ai', text: aiReply }]);
      
      if (extractedDraft) {
        setBookDraft(prev => prev ? prev + "\n\n" + extractedDraft : extractedDraft);
      }

      if (!currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        if (user) loadSessions(user.id);
      }
    } catch (err: any) { 
      console.error("Server Error Full Details:", err.response?.data);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || "Connection Failed";
      alert(`API Error: ${errorMsg}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDigDeeper = () => {
      handleSend("That's the basic idea, but can you ask me a specific question to dig deeper into the emotions, details, or background of what I just said?");
  };

  const deleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation(); e.preventDefault();
    if (!confirm("Delete permanently?")) return;
    try {
      await axios.delete(`https://muse-backend-qy5z.onrender.com/api/sessions/${sid}`);
      if (user) loadSessions(user.id);
      if (currentSessionId === sid) startNewChat();
    } catch (err) { alert("Delete failed"); }
  };

  const handleSpeak = (text: string, index: number) => {
    if (!window.speechSynthesis) return alert("Your browser does not support text-to-speech.");
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    if (isListening) { setIsListening(false); recognition.stop(); }
    else {
      setIsListening(true); recognition.start();
      recognition.onresult = (e: any) => {
        setInput(prev => prev + " " + e.results[0][0].transcript);
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
    setIsSidebarOpen(false); // <-- Mobile par new chat ke baad sidebar band
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const handleAuth = async () => {
    try {
      if (isReset) {
        await axios.post('https://muse-backend-qy5z.onrender.com/api/auth/reset-password', { email: authForm.email, newPassword: authForm.password });
        alert("Success! Login now.");
        setIsReset(false); setIsLogin(true);
        return;
      }
      const path = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await axios.post(`https://muse-backend-qy5z.onrender.com${path}`, authForm);
      const data = { name: res.data.name, id: res.data.id };
      setUser(data);
      localStorage.setItem('user_muse', JSON.stringify(data));
      loadSessions(data.id);
      setShowAuth(false);
    } catch (err) { alert("Auth failed"); }
  };

  const handleGoogleAuth = async (accessToken: string) => {
    try {
      const res = await axios.post('https://muse-backend-qy5z.onrender.com/api/auth/google', { token: accessToken });
      const data = { name: res.data.name, id: res.data.id };
      setUser(data);
      localStorage.setItem('user_muse', JSON.stringify(data));
      loadSessions(data.id);
      setShowAuth(false);
    } catch (err) { alert("Google Auth failed"); }
  };

  const downloadTXT = () => {
    const blob = new Blob([bookDraft], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `Manuscript_${Date.now()}.txt`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("times", "bold").text("Wail's Muse - Manuscript Draft", 20, 20);
    doc.setFont("times", "normal").setFontSize(12);
    const split = doc.splitTextToSize(bookDraft.replace(/[#*]/g, ''), 170);
    doc.text(split, 20, 30);
    doc.save("Manuscript.pdf");
  };

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-[#0d1117]' : 'bg-[#fcfcfc]',
    sidebar: theme === 'dark' ? 'bg-[#161b22]' : 'bg-[#f0f2f5]',
    text: theme === 'dark' ? 'text-gray-100' : 'text-gray-800',
    border: theme === 'dark' ? 'border-gray-800' : 'border-gray-200',
    chatAi: theme === 'dark' ? 'bg-[#1c2128]' : 'bg-white shadow-sm border border-gray-100',
    input: theme === 'dark' ? 'bg-[#161b22]' : 'bg-white',
    iconHover: theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200',
  };

  return (
    <div className={`flex h-[100dvh] ${themeClasses.bg} ${themeClasses.text} font-sans transition-colors duration-300 overflow-hidden relative`}>
      
      {/* --- RESPONSIVE SIDEBAR --- */}
      {/* Mobile Background Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Box */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 ${themeClasses.sidebar} border-r ${themeClasses.border} flex flex-col p-6 transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${zenMode ? 'hidden' : 'flex'}`}>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/30">
                <Sparkles size={20} className="fill-white" />
            </div>
            <h1 className="font-black text-2xl tracking-tighter text-blue-600">MUSE</h1>
          </div>
          {/* Mobile close button */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        <button onClick={startNewChat} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl transition mb-8 font-bold shadow-lg shadow-blue-500/20 active:scale-95">
          <Plus size={20}/> New Masterpiece
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest px-2 mb-3 flex items-center gap-2">
              <Zap size={12} className="text-yellow-500" /> Your Library
          </p>
          {sessions.map((s, i) => (
            <div key={i} className="group relative">
              <button
                onClick={() => loadSessionHistory(s.sessionId)}
                className={`flex items-center gap-3 p-3 w-full rounded-xl text-left text-sm transition font-medium ${currentSessionId === s.sessionId ? 'bg-blue-50 text-blue-600 border border-blue-100' : `hover:bg-black/5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}`}
              >
                <MessageSquare size={16} className={currentSessionId === s.sessionId ? "text-blue-500" : "text-gray-400"} />
                <span className="truncate">{s.content}</span>
              </button>
              <Trash2 onClick={(e: React.MouseEvent) => deleteSession(e, s.sessionId)} size={14} className="absolute right-3 top-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer" />
            </div>
          ))}
          {!user && (
              <div className="p-4 mt-4 bg-blue-50 dark:bg-[#1c2128] rounded-xl border border-blue-100 dark:border-gray-800 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">Login to save your library</p>
              </div>
          )}
        </div>

        <div className="mt-auto space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${themeClasses.border} bg-white dark:bg-[#161b22] shadow-sm hover:shadow-md transition`}>
                  {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-500" />}
              </button>
              {user ? (
                  <button onClick={() => {localStorage.clear(); window.location.reload();}} className={`p-3 rounded-xl border ${themeClasses.border} bg-white dark:bg-[#161b22] shadow-sm hover:shadow-md hover:text-red-500 transition`} title="Logout">
                      <LogOut size={18}/>
                  </button>
              ) : (
                  <button onClick={() => setShowAuth(true)} className={`p-3 px-4 rounded-xl border ${themeClasses.border} bg-white dark:bg-[#161b22] text-xs font-bold uppercase text-blue-600 shadow-sm hover:shadow-md transition`} title="Login">
                      Login
                  </button>
              )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      {/* Note: Hidden on mobile IF Draft is open, taake Draft ko poori space mil sakay */}
      <div className={`flex-1 flex-col transition-all duration-500 ${isDraftOpen ? 'hidden md:flex md:w-1/2' : 'flex w-full'}`}>
        <header className={`p-3 md:p-5 border-b ${themeClasses.border} flex justify-between items-center ${themeClasses.bg} z-10 shadow-sm shadow-black/5`}>
          <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Hamburger Icon */}
              {!zenMode && (
                <button onClick={() => setIsSidebarOpen(true)} className={`md:hidden p-2 rounded-lg ${themeClasses.iconHover} text-gray-500 transition`}>
                  <Menu size={24} />
                </button>
              )}
              <button onClick={() => setZenMode(!zenMode)} className={`hidden md:block p-2 rounded-lg ${themeClasses.iconHover} text-gray-500 transition`}>
                  {zenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <select
                  value={writingMode}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWritingMode(e.target.value)}
                  className={`bg-transparent border ${themeClasses.border} text-[10px] md:text-xs font-bold uppercase rounded-lg px-2 py-1.5 md:px-3 md:py-1.5 outline-none cursor-pointer focus:border-blue-500 text-gray-500`}
              >
                  <option className="text-black">Creative</option>
                  <option className="text-black">Professional</option>
                  <option className="text-black">Dramatic</option>
                  <option className="text-black">Mystery</option>
              </select>
          </div>
          <button onClick={() => setIsDraftOpen(!isDraftOpen)} className={`flex items-center gap-2 p-2 md:p-2.5 rounded-xl transition font-bold text-[10px] md:text-xs uppercase tracking-wider ${isDraftOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <LayoutPanelLeft size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="md:block">{isDraftOpen ? 'Close Draft' : 'Open Draft'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-8 lg:p-12 space-y-6 md:space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center select-none p-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-6 rounded-full mb-4 md:mb-6">
                  <BookOpen size={48} className="text-blue-500 md:w-[64px] md:h-[64px]" />
              </div>
              <h2 className="text-xl md:text-3xl italic font-serif text-gray-800 dark:text-gray-300">"Let's write your story..."</h2>
              <p className="mt-2 md:mt-3 text-xs md:text-sm font-sans uppercase tracking-widest text-gray-500">I will interview you and write the book.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 md:p-6 rounded-2xl md:rounded-[2rem] max-w-[92%] md:max-w-[85%] text-[0.95rem] md:text-[1.1rem] leading-relaxed transition-all relative group ${
                m.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/20' : `${themeClasses.chatAi} rounded-tl-none text-gray-700 dark:text-gray-300`
              }`}>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
                
                {m.role === 'ai' && (
                  <button
                    onClick={() => handleSpeak(m.text, i)}
                    className="mt-3 md:mt-4 flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold text-gray-400 hover:text-blue-500 transition uppercase tracking-widest border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-gray-800 w-max"
                  >
                    {speakingIndex === i ? (
                      <><VolumeX size={12} className="md:w-[14px] md:h-[14px] text-red-500"/> Stop Reading</>
                    ) : (
                      <><Volume2 size={12} className="md:w-[14px] md:h-[14px] text-blue-500"/> Listen</>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 md:gap-3 text-blue-500 italic text-xs md:text-sm ml-2 md:ml-6 font-medium animate-pulse">
              <Loader2 className="animate-spin" size={14} className="md:w-[16px] md:h-[16px]" /> Muse is writing & thinking...
            </div>
          )}
          <div ref={scrollRef} />
        </main>

        <footer className={`p-3 md:p-6 lg:px-12 ${themeClasses.bg} border-t ${themeClasses.border}`}>
          
          {!user && messages.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-500 text-[10px] md:text-sm font-bold px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl mb-3 md:mb-4 flex justify-between items-center shadow-sm">
              <span className="flex items-center gap-1.5 md:gap-2"><AlertTriangle size={14} className="md:w-[16px] md:h-[16px]" /> You are chatting as a Guest.</span>
              <button onClick={() => setShowAuth(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl transition uppercase tracking-wider text-[9px] md:text-[10px]">Login</button>
            </div>
          )}

          {messages.length > 0 && (
              <div className="flex gap-2 mb-3 md:mb-4">
                  <button onClick={handleDigDeeper} className="flex items-center justify-center gap-1.5 md:gap-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 text-gray-500 text-[10px] md:text-xs font-bold uppercase px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all border shadow-sm border-gray-200 dark:border-gray-700 w-full md:w-auto">
                      <Telescope size={14}/> Ask me to Dig Deeper
                  </button>
              </div>
          )}
          <div className="relative flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleListening}
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border ${themeClasses.border} shadow-sm ${isListening ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' : 'bg-white dark:bg-[#161b22] text-gray-400 hover:text-blue-500 hover:border-blue-200'}`}
            >
              {isListening ? <Mic size={20} className="md:w-[24px] md:h-[24px]" /> : <MicOff size={20} className="md:w-[24px] md:h-[24px]" />}
            </button>
            
            <textarea
              className={`flex-1 ${themeClasses.input} border-2 ${themeClasses.border} rounded-2xl md:rounded-3xl p-3 md:p-5 pr-12 md:pr-16 outline-none focus:border-blue-400 transition-all text-sm md:text-lg shadow-sm resize-none custom-scrollbar placeholder:text-gray-400 dark:placeholder:text-gray-600`}
              placeholder={isListening ? "Listening..." : "Tell me your memories..."}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              style={{ minHeight: '52px', maxHeight: '150px' }}
            />

            <button onClick={() => handleSend()} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-blue-600 text-white rounded-xl md:rounded-2xl hover:bg-blue-700 shadow-md shadow-blue-500/30 active:scale-95 transition-all">
              <Send size={16} className="md:w-[20px] md:h-[20px]" />
            </button>
          </div>
        </footer>
      </div>

      {/* --- RESPONSIVE DRAFT PANEL --- */}
      {/* Mobile par full width, Desktop par w-1/2 */}
      <div className={`fixed inset-0 z-40 w-full md:static md:w-1/2 flex flex-col transition-transform duration-500 bg-white dark:bg-[#0d1117] border-l ${themeClasses.border} shadow-2xl ${isDraftOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}`}>
        <header className={`p-3 md:p-5 border-b ${themeClasses.border} flex justify-between items-center bg-[#fcfcfc] dark:bg-[#161b22] mt-[env(safe-area-inset-top)]`}>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsDraftOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
              <X size={20} />
            </button>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg hidden md:block">
                <PenLine size={18} className="text-blue-600"/>
            </div>
            <h2 className="font-bold text-[10px] md:text-xs text-gray-600 dark:text-gray-400 uppercase tracking-widest">Manuscript</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={downloadPDF} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition" title="Export PDF"><FileDown size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <button onClick={downloadTXT} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition" title="Export Text"><FileJson size={16} className="md:w-[18px] md:h-[18px]"/></button>
            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-700 mx-1 md:mx-2"></div>
            <button onClick={() => setBookDraft("")} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition" title="Clear Draft"><Eraser size={16} className="md:w-[18px] md:h-[18px]"/></button>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto custom-scrollbar">
            <textarea
            className={`w-full h-full bg-transparent outline-none resize-none font-serif text-[1.1rem] md:text-[1.35rem] leading-[2] md:leading-[2.2] transition-all text-gray-800 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-700`}
            placeholder="As you answer my questions, your book will automatically be written and formatted here..."
            value={bookDraft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBookDraft(e.target.value)}
            />
        </div>
      </div>

      {/* --- RESPONSIVE AUTH MODAL --- */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm transition-all">
           <div className="bg-white dark:bg-[#161b22] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] w-full max-w-sm md:max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl relative text-gray-800 dark:text-white">
           
           <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-red-500">
               <X size={20} className="md:w-[24px] md:h-[24px]" />
           </button>

           <h2 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 text-center tracking-tighter italic uppercase text-blue-600">
               {isReset ? 'Reset Access' : isLogin ? 'Sign In' : 'Join Muse'}
           </h2>
           <div className="space-y-3 md:space-y-4">
             {!isLogin && !isReset && <input placeholder="Your Name" className="w-full p-4 md:p-5 text-sm md:text-base bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl outline-none focus:border-blue-500 transition" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthForm({...authForm, name: e.target.value})}/>}
             <input placeholder="Email" className="w-full p-4 md:p-5 text-sm md:text-base bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl outline-none focus:border-blue-500 transition" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthForm({...authForm, email: e.target.value})}/>
             <input type="password" placeholder="Password" className="w-full p-4 md:p-5 text-sm md:text-base bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-xl md:rounded-2xl outline-none focus:border-blue-500 transition" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthForm({...authForm, password: e.target.value})}/>
             <button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700 p-4 md:p-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl mt-4 md:mt-6 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 uppercase">CONTINUE</button>
             
             <div className="relative py-2 md:py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
                <div className="relative flex justify-center"><span className="bg-white dark:bg-[#161b22] px-3 md:px-4 text-[10px] md:text-xs text-gray-400 uppercase font-bold">OR</span></div>
             </div>
             
             <GoogleOAuthProvider clientId="691831191491-8dff26vujkmstq9do9sr7n32o6ghmmam.apps.googleusercontent.com">
                <GoogleLoginButton onSuccess={handleGoogleAuth} />
             </GoogleOAuthProvider>

             <p onClick={() => setIsLogin(!isLogin)} className="text-center text-[10px] md:text-xs font-bold text-gray-400 cursor-pointer hover:text-blue-500 mt-4 md:mt-6 transition uppercase tracking-wider">
               {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
             </p>
           </div>
         </div>
       </div>
      )}
    </div>
  );
}