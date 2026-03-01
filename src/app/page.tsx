"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Send, Sparkles, LogOut, Loader2, UserCircle,
  BookOpen, Plus, MessageSquare, FileDown, Menu, X,
  FileJson, KeyRound, Trash2, LayoutPanelLeft, PenLine,
  Mic, MicOff, Eraser, Type, Zap, Sun, Moon, Maximize2, Minimize2, Telescope,
  Volume2, VolumeX, AlertTriangle, ChevronRight
} from 'lucide-react';

// --- CUSTOM GOOGLE LOGIN BUTTON ---
const GoogleLoginButton = ({ onSuccess }: { onSuccess: (token: string) => void }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: () => alert('Google Login Failed'),
  });

  return (
    <button onClick={() => login()} className="w-full bg-white dark:bg-[#161b22] border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 p-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3 transition active:scale-95 shadow-sm">
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
  
  // Mobile States
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [input, setInput] = useState('');
  const [user, setUser] = useState<{name: string, id: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [zenMode, setZenMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [writingMode, setWritingMode] = useState('Conversational (My Voice)');
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    return () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
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
    setIsSidebarOpen(false); // Close sidebar on mobile after selecting
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
      if (reconstructedDraft) setBookDraft(reconstructedDraft.trim());
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
      if (extractedDraft) setBookDraft(prev => prev ? prev + "\n\n" + extractedDraft : extractedDraft);

      if (!currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        if (user) loadSessions(user.id);
      }
    } catch (err) { alert("Server error"); } finally { setLoading(false); }
  };

  const handleDigDeeper = () => {
      handleSend("That's a good summary, but I want to dive deeper. Ask me 3 specific, probing questions about the emotions or unseen details of this memory.");
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
    if (!window.speechSynthesis) return alert("Text-to-speech not supported.");
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported for dictation.");
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
    setIsSidebarOpen(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const handleAuth = async () => { /* Standard Email Auth */ };
  const handleGoogleAuth = async (accessToken: string) => { /* Google Auth */ };
  const downloadTXT = () => { /* TXT Logic */ };
  const downloadPDF = () => { /* PDF Logic */ };

  const themeClasses = {
    bg: theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]',
    sidebar: theme === 'dark' ? 'bg-[#111111] border-[#222]' : 'bg-white border-gray-200',
    text: theme === 'dark' ? 'text-gray-100' : 'text-gray-800',
    border: theme === 'dark' ? 'border-[#222]' : 'border-gray-200',
    chatAi: theme === 'dark' ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-100 shadow-sm',
    input: theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-800',
  };

  return (
    <div className={`flex h-screen ${themeClasses.bg} ${themeClasses.text} font-sans transition-colors duration-300 overflow-hidden`}>
      
      {/* MOBILE OVERLAY FOR SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR (Responsive) */}
      <aside className={`fixed md:relative z-50 inset-y-0 left-0 w-72 ${themeClasses.sidebar} border-r flex flex-col p-5 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${zenMode ? 'md:hidden' : 'md:flex'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
                <BookOpen size={20} className="fill-current" />
            </div>
            <h1 className="font-black text-2xl tracking-tighter text-blue-600">Muse.AI</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <button onClick={startNewChat} className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white dark:text-black text-white p-3.5 rounded-xl transition mb-6 font-bold shadow-md hover:scale-[1.02] active:scale-95 text-sm">
          <Plus size={18}/> Start New Interview
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 mb-3 mt-2">Past Interviews</p>
          {sessions.map((s, i) => (
            <div key={i} className="group relative">
              <button
                onClick={() => loadSessionHistory(s.sessionId)}
                className={`flex items-center gap-3 p-3 w-full rounded-xl text-left text-sm transition font-medium ${currentSessionId === s.sessionId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400'}`}
              >
                <MessageSquare size={16} className={currentSessionId === s.sessionId ? "text-blue-500" : "opacity-50"} />
                <span className="truncate">{s.content}</span>
              </button>
              <Trash2 onClick={(e) => deleteSession(e, s.sessionId)} size={14} className="absolute right-3 top-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer" />
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-gray-200 dark:border-[#222]">
          <div className="flex gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border ${themeClasses.border} hover:bg-gray-50 dark:hover:bg-white/5 transition`}>
                {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-blue-500" />}
            </button>
            {user ? (
                <button onClick={() => {localStorage.clear(); window.location.reload();}} className={`p-3 rounded-xl border ${themeClasses.border} hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 transition`} title="Logout">
                    <LogOut size={18}/>
                </button>
            ) : (
                <button onClick={() => setShowAuth(true)} className={`flex-1 p-3 rounded-xl border ${themeClasses.border} text-xs font-bold uppercase text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition`}>
                    Sign In
                </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className={`flex-1 flex relative w-full ${isDraftOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex flex-col w-full transition-all duration-500 h-full">
          
          <header className={`p-4 md:p-5 border-b ${themeClasses.border} flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-10 sticky top-0`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                <Menu size={20} />
              </button>
              <button onClick={() => setZenMode(!zenMode)} className={`hidden md:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition`}>
                  {zenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              
              {/* Writer Voice Selector */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-lg border border-gray-200 dark:border-[#333]">
                <PenLine size={14} className="ml-2 text-gray-500" />
                <select value={writingMode} onChange={(e) => setWritingMode(e.target.value)} className="bg-transparent text-xs font-bold rounded-lg px-2 py-1.5 outline-none cursor-pointer text-gray-700 dark:text-gray-300">
                    <option>Conversational (My Voice)</option>
                    <option>Professional Memoir</option>
                    <option>Storytelling/Dramatic</option>
                </select>
              </div>
            </div>

            <button onClick={() => setIsDraftOpen(!isDraftOpen)} className="flex items-center gap-2 p-2 px-3 md:px-4 rounded-full transition font-bold text-xs bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black shadow-md">
              <LayoutPanelLeft size={16} />
              <span>{isDraftOpen ? 'Hide Draft' : 'View Manuscript'}</span>
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-16 xl:px-32 space-y-6 scroll-smooth pb-32">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-70 text-center select-none max-w-lg mx-auto">
                <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 p-5 rounded-3xl mb-6 shadow-xl shadow-blue-500/20">
                    <Sparkles size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Ready to write your book?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">I will interview you chapter by chapter, adapt to your tone of voice, and format your stories into a polished manuscript.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-5 md:p-6 rounded-3xl max-w-[90%] md:max-w-[85%] leading-relaxed text-[1rem] transition-all relative ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/10' 
                  : `${themeClasses.chatAi} rounded-tl-sm border text-gray-800 dark:text-gray-200`
                }`}>
                  <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-sm md:prose-base">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  
                  {m.role === 'ai' && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-[#333]">
                      <button onClick={() => handleSpeak(m.text, i)} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 dark:bg-[#111] dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-full transition uppercase tracking-wider">
                        {speakingIndex === i ? <><VolumeX size={14}/> Stop</> : <><Volume2 size={14}/> Listen</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-3 text-blue-500 text-sm ml-2 md:ml-6 font-medium bg-blue-50 dark:bg-blue-500/10 w-fit px-4 py-2.5 rounded-full animate-pulse border border-blue-100 dark:border-blue-500/20">
                <Loader2 className="animate-spin" size={16} /> Muse is writing...
              </div>
            )}
            <div ref={scrollRef} />
          </main>

          <footer className={`absolute bottom-0 w-full p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-transparent z-10`}>
            <div className="max-w-4xl mx-auto w-full">
              
              {/* SMART PROMPTS (Client Request: "Dig Deeper") */}
              {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
                  <div className="flex overflow-x-auto gap-2 mb-3 pb-2 custom-scrollbar hide-scrollbar">
                      <button onClick={handleDigDeeper} className="shrink-0 flex items-center gap-2 bg-white dark:bg-[#1a1a1a] hover:border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 rounded-full transition-all border shadow-sm border-blue-200 dark:border-[#333]">
                          <Telescope size={14}/> Ask me to Dig Deeper
                      </button>
                      <button onClick={() => handleSend("Let's move on to the next chapter or topic.")} className="shrink-0 flex items-center gap-2 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 text-gray-600 dark:text-gray-300 text-xs font-medium px-4 py-2 rounded-full transition-all border shadow-sm border-gray-200 dark:border-[#333]">
                          Next Topic <ChevronRight size={14}/>
                      </button>
                  </div>
              )}

              <div className="relative flex items-end gap-2 md:gap-3 bg-white dark:bg-[#1a1a1a] border shadow-lg shadow-black/5 dark:shadow-black/20 border-gray-200 dark:border-[#333] rounded-3xl p-2">
                <button onClick={toggleListening} className={`p-3 rounded-full transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-[#222] text-gray-500 hover:text-blue-600'}`}>
                  {isListening ? <Mic size={20}/> : <MicOff size={20}/>}
                </button>
                
                <textarea
                  className="flex-1 bg-transparent py-3 px-2 outline-none resize-none text-base md:text-lg max-h-32 custom-scrollbar placeholder:text-gray-400"
                  placeholder={isListening ? "Listening..." : "Tell your story..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1}
                />

                <button onClick={() => handleSend()} className="shrink-0 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50" disabled={!input.trim()}>
                  <Send size={20}/>
                </button>
              </div>
              <div className="text-center mt-2 hidden md:block">
                  <span className="text-[10px] text-gray-400 font-medium">Shift + Enter for new line. Muse AI will format your text automatically.</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* DRAFT / MANUSCRIPT PANEL (Responsive) */}
      <div className={`${isDraftOpen ? 'flex' : 'hidden'} fixed inset-0 z-50 md:relative md:flex flex-col w-full md:w-1/2 lg:w-[45%] bg-white dark:bg-[#0f0f0f] md:border-l ${themeClasses.border} shadow-2xl animate-in slide-in-from-right duration-300`}>
        <header className={`p-4 md:p-5 border-b ${themeClasses.border} flex justify-between items-center bg-gray-50 dark:bg-[#111]`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDraftOpen(false)} className="md:hidden p-2 bg-gray-200 dark:bg-gray-800 rounded-full mr-2">
                <ChevronRight size={18} className="text-gray-600 dark:text-gray-300"/>
            </button>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <PenLine size={16} className="text-blue-600"/>
            </div>
            <div>
                <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">The Manuscript</h2>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Live Draft</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 bg-white dark:bg-[#1a1a1a] p-1 rounded-xl border border-gray-200 dark:border-[#333]">
            <button onClick={downloadPDF} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-500 transition" title="Export PDF"><FileDown size={16}/></button>
            <button onClick={downloadTXT} className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-500 text-gray-500 transition" title="Export Text"><FileJson size={16}/></button>
            <div className="w-[1px] h-4 bg-gray-300 dark:bg-[#444] mx-1"></div>
            <button onClick={() => setBookDraft("")} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Clear Draft"><Eraser size={16}/></button>
          </div>
        </header>
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-paper.png')] dark:bg-none">
            <textarea
              className={`w-full h-full bg-transparent outline-none resize-none font-serif text-lg md:text-[1.35rem] leading-[2.2] text-gray-800 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-700`}
              placeholder="As you answer questions, your book will automatically be written and formatted here..."
              value={bookDraft}
              onChange={(e) => setBookDraft(e.target.value)}
            />
        </div>
      </div>
      
      {/* Auth Modal (Hidden by default, standard unchanged) */}
      {showAuth && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
             {/* Same Auth modal content... */}
             <div className="bg-white dark:bg-[#161b22] p-10 rounded-[2.5rem] w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl relative text-gray-800 dark:text-white">
               <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X size={24}/></button>
               <h2 className="text-4xl font-black mb-8 text-center tracking-tighter italic uppercase text-blue-600">Join Muse</h2>
               <div className="space-y-4">
                 <GoogleOAuthProvider clientId="691831191491-8dff26vujkmstq9do9sr7n32o6ghmmam.apps.googleusercontent.com">
                    <GoogleLoginButton onSuccess={handleGoogleAuth} />
                 </GoogleOAuthProvider>
               </div>
             </div>
         </div>
      )}
    </div>
  );
}