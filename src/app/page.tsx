"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PublisherDashboard from '@/components/PublisherDashboard';
import ClientInterview from '@/components/ClientInterview';
import { VoiceAgent } from '@/utils/voiceAgent';
import { Sun, Moon, LogOut, X, Loader2 } from 'lucide-react';

// Ultra HDR Design

interface Client {
  id: string;
  name: string;
  email: string;
  bookTitle: string;
  uniqueLink: string;
  sessionId: string | null;
  lastActive: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  messages: { role: 'user' | 'ai', text: string }[];
  bookDraft: string;
  wordCount: number;
  sport?: string;
  publisherId?: string;
  createdAt?: string;
}

type Message = { role: 'user' | 'ai'; text: string };

export default function Home() {
  const [user, setUser] = useState<{ name: string, id: string, role: 'publisher' | 'client' } | null>(null);
  const [isPublisher, setIsPublisher] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientBook, setNewClientBook] = useState('');
  const [newClientSport, setNewClientSport] = useState('baseball');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookDraft, setBookDraft] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const voiceAgentRef = useRef<VoiceAgent | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  
  // Backend URL helper
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://muse-backend-production-29cd.up.railway.app';
  
  // Dynamic welcome message - AI will guide the conversation
  const getWelcomeMessage = (clientName: string) => {
    return `Hey ${clientName}, thanks for sitting down with me. Let's start from the beginning - tell me about where you grew up.`;
  };

  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent({
      onListeningChange: setIsListening,
      onSpeakingChange: setIsSpeaking,
      onTranscript: setInput,
      onFinalTranscript: (text) => handleSend(text),
      onError: (error) => console.error('Voice error:', error)
    });
    voiceAgentRef.current.setSilenceMs(2500); // 2.5 seconds for better accuracy
    voiceAgentRef.current.setLanguage('en-US');
    voiceAgentRef.current.setVoice({ rate: 0.9, pitch: 1.02, volume: 1.0 });
    return () => voiceAgentRef.current?.stop();
  }, []);

  useEffect(() => {
    // Check if already authenticated with valid token
    const token = localStorage.getItem('muse_publisher_token');
    
    if (token) {
      // Verify token with backend
      fetch(`${BACKEND_URL}/api/publisher/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser({
            name: data.user.name,
            id: data.user.id,
            role: data.user.role
          });
          setIsPublisher(true);
          setShowAuth(false);
          loadClientsFromBackend();
        } else {
          // Invalid token
          localStorage.removeItem('muse_publisher_token');
        }
      })
      .catch(() => {
        // Token verification failed
        localStorage.removeItem('muse_publisher_token');
      });
    }
    
    const savedTheme = localStorage.getItem('muse_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const loadClientsFromBackend = async () => {
    // Load localStorage first (instant display)
    const savedClients = localStorage.getItem('muse_clients');
    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch {}
    }

    // Then sync with backend
    const token = localStorage.getItem('muse_publisher_token');
    if (!token) return;

    try {
      const res = await axios.get(`${BACKEND_URL}/api/clients?publisherId=publisher_1`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 8000
      });
      if (res.data.success) {
        const backendClients: Client[] = res.data.clients;
        const localClients: Client[] = savedClients ? JSON.parse(savedClients) : [];
        // Keep local-only clients (not yet synced to backend)
        const backendIds = new Set(backendClients.map((c: Client) => c.id));
        const localOnly = localClients.filter(c => !backendIds.has(c.id));
        const merged = [...backendClients, ...localOnly];
        setClients(merged);
        localStorage.setItem('muse_clients', JSON.stringify(merged));
        console.log(`✅ Synced: ${backendClients.length} backend + ${localOnly.length} local clients`);
      }
    } catch (error: any) {
      console.error('Backend sync failed, using localStorage:', error?.response?.data || error.message);
    }
  };

  // Handle publisher login with backend verification
  const handlePublisherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      // Send password to backend for verification
      const res = await fetch(`${BACKEND_URL}/api/publisher/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Save JWT token
        localStorage.setItem('muse_publisher_token', data.token);
        
        // Set user state
        setUser({
          name: data.user.name,
          id: data.user.id,
          role: data.user.role
        });
        setIsPublisher(true);
        setShowAuth(false);
        setPassword('');
        loadClientsFromBackend();
      } else {
        // Wrong password
        setAuthError(data.error || 'Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Connection error. Please try again.');
      setPassword('');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('muse_publisher_token');
    setUser(null);
    setIsPublisher(false);
    setShowAuth(true);
    setPassword('');
    setAuthError('');
  };

  // Removed localStorage sync - now using backend

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setMessages(client.messages || []);
        setBookDraft(client.bookDraft || '');
      }
    }
  }, [selectedClientId, clients]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    if (voiceAgentRef.current && isListening) voiceAgentRef.current.stopListening();

    const newMsgs: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const client = clients.find(c => c.id === selectedClientId);
      const athleteSport = client?.sport || 'general';
      
      const res = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: textToSend,
        userId: selectedClientId || user?.id || null,
        history: messages,
        mode: 'Creative',
        sport: athleteSport
      });

      // ✅ USE BACKEND RESPONSE (Kelly Cole style from AI)
      const aiReply = res.data.reply || "Tell me more about that.";

      const updatedMsgs: Message[] = [...newMsgs, { role: 'ai', text: aiReply }];
      setMessages(updatedMsgs);

      const newDraftContent = `**User:** ${textToSend}\n\n**AI:** ${aiReply}`;
      const updatedDraft = bookDraft ? bookDraft + "\n\n---\n\n" + newDraftContent : newDraftContent;
      setBookDraft(updatedDraft);

      if (isPublisher && selectedClientId) updateClientProgress(selectedClientId, updatedMsgs, updatedDraft);
      if (voiceAgentRef.current?.isVoiceActive()) {
        voiceAgentRef.current.enqueueSpeak(aiReply);
        voiceAgentRef.current.completeProcessing();
      }
    } catch (err) {
      console.error('Send error:', err);
      const errorMsg = "I'm having trouble connecting. Let's try again.";
      setMessages([...newMsgs, { role: 'ai', text: errorMsg }]);
      if (voiceAgentRef.current?.isVoiceActive()) {
        voiceAgentRef.current.speak(errorMsg);
        voiceAgentRef.current.completeProcessing();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateClientProgress = async (clientId: string, msgs: Message[], draft: string) => {
    const wordCount = draft.split(/\s+/).filter(w => w.length > 0).length;
    const progress = Math.min(Math.floor(wordCount / 50), 100);
    
    const updatedClients = clients.map(c =>
      c.id === clientId ? {
        ...c, messages: msgs, bookDraft: draft, wordCount, progress,
        status: (progress >= 100 ? 'completed' : 'active') as 'completed' | 'active' | 'pending',
        lastActive: new Date().toISOString()
      } : c
    );
    
    setClients(updatedClients);
    localStorage.setItem('muse_clients', JSON.stringify(updatedClients));

    const token = localStorage.getItem('muse_publisher_token');
    try {
      await axios.put(`${BACKEND_URL}/api/clients/${clientId}`, {
        messages: msgs, bookDraft: draft, wordCount, progress,
        status: progress >= 100 ? 'completed' : 'active'
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error: any) {
      console.error('Backend save failed (saved locally):', error?.response?.data || error.message);
    }
  };

  const toggleVoiceAgent = () => {
    if (isVoiceActive) {
      voiceAgentRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      const client = clients.find(c => c.id === selectedClientId);
      const clientName = isPublisher ? client?.name : user?.name;
      
      // If interview already started, just activate voice without welcome message
      if (messages.length > 0) {
        voiceAgentRef.current?.start(); // No welcome message, just start listening
        setIsVoiceActive(true);
      } else {
        // First time - speak welcome message
        const welcomeMsg = getWelcomeMessage(clientName || 'there');
        voiceAgentRef.current?.start(welcomeMsg);
        setIsVoiceActive(true);
        setMessages([{ role: 'ai', text: welcomeMsg }]);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) voiceAgentRef.current?.stopListening();
    else voiceAgentRef.current?.startListening();
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

  const handleAddClient = async () => {
    if (!newClientName || !newClientEmail || !newClientBook) {
      alert('Please fill all fields');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('muse_publisher_token');
    
    // Try backend first
    if (token) {
      console.log('Attempting to create client via backend...');
      
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/clients`,
          {
            name: newClientName,
            email: newClientEmail,
            bookTitle: newClientBook,
            sport: newClientSport,
            publisherId: 'publisher_1'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
        
        console.log('✅ Backend response:', res.data);
        
        if (res.data?.success && res.data?.client) {
          const serverClient: Client = res.data.client;
          const updated = [...clients, serverClient];
          setClients(updated);
          localStorage.setItem('muse_clients', JSON.stringify(updated));
          
          setNewClientName('');
          setNewClientEmail('');
          setNewClientBook('');
          setNewClientSport('baseball');
          setShowAddClient(false);
          
          navigator.clipboard.writeText(serverClient.uniqueLink);
          alert(`✅ Client ${serverClient.name} added!\n\n📋 Link copied to clipboard.`);
          return;
        }
      } catch (error: any) {
        console.error('❌ Backend error:', error?.response?.data || error.message);
        
        if (error?.response?.status === 401) {
          alert('❌ Session expired. Please login again.');
          handleLogout();
          return;
        }
        
        // Continue to fallback
        console.log('Falling back to localStorage...');
      }
    }
    
    // Fallback: Create client locally
    console.log('Creating client locally (localStorage)');
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin;
    const uniqueLink = `${frontendUrl}/interview/${clientId}?name=${encodeURIComponent(newClientName)}&book=${encodeURIComponent(newClientBook)}&sport=${newClientSport}`;
    
    const localClient: Client = {
      id: clientId,
      name: newClientName,
      email: newClientEmail,
      bookTitle: newClientBook,
      sport: newClientSport,
      uniqueLink,
      sessionId: null,
      lastActive: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      messages: [],
      bookDraft: '',
      wordCount: 0,
      publisherId: 'publisher_1',
      createdAt: new Date().toISOString()
    };
    
    const updated = [...clients, localClient];
    setClients(updated);
    localStorage.setItem('muse_clients', JSON.stringify(updated));
    
    setNewClientName('');
    setNewClientEmail('');
    setNewClientBook('');
    setNewClientSport('baseball');
    setShowAddClient(false);
    
    navigator.clipboard.writeText(uniqueLink);
    alert(`✅ Client ${newClientName} added!\n\n📋 Link copied to clipboard.\n\n💡 Note: Using local storage (backend unavailable)`);
  };

  const handleSelectClient = (clientId: string) => setSelectedClientId(clientId);
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Delete this client and all their data?')) return;

    // Remove from state immediately (optimistic update)
    const updatedClients = clients.filter(c => c.id !== clientId);
    setClients(updatedClients);
    localStorage.setItem('muse_clients', JSON.stringify(updatedClients));

    if (selectedClientId === clientId) {
      setSelectedClientId(null);
      setMessages([]);
      setBookDraft('');
    }

    // Try backend delete
    const token = localStorage.getItem('muse_publisher_token');
    if (token) {
      try {
        await axios.delete(`${BACKEND_URL}/api/clients/${clientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Client deleted from backend');
      } catch (error: any) {
        console.error('Backend delete failed (deleted locally):', error?.response?.data || error.message);
      }
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const handleSendEmail = (email: string, link: string) => {
    const subject = encodeURIComponent('Your Book Interview Link');
    const body = encodeURIComponent(`Dear Client,\n\nHere is your personal interview link:\n\n${link}\n\nClick the link to start your book interview.\n\nBest regards`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('muse_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const wordCount = bookDraft.split(/\s+/).filter(w => w.length > 0).length;

  // Show simple password screen for publisher
  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'var(--bg-subtle)' }}>
        <div className="w-full max-w-sm animate-fadeUp">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
              style={{ background: 'var(--accent)', boxShadow: '0 8px 24px rgba(91,91,214,0.35)' }}>
              M
            </div>
            <h1 className="text-title" style={{ color: 'var(--fg)' }}>Muse Publisher</h1>
            <p className="text-small mt-1" style={{ color: 'var(--fg-muted)' }}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Card */}
          <div className="card p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <form onSubmit={handlePublisherLogin} className="space-y-4">
              <div>
                <label className="text-label block mb-1.5" style={{ color: 'var(--fg-muted)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input"
                  autoFocus
                />
                {authError && (
                  <p className="text-small mt-2" style={{ color: 'var(--danger)' }}>{authError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="btn btn-primary w-full"
                style={{ padding: '10px', fontSize: '14px' }}
              >
                {authLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Verifying...</>
                ) : 'Access Dashboard'}
              </button>
            </form>
          </div>

          <p className="text-center text-small mt-4" style={{ color: 'var(--fg-faint)' }}>
            Muse — AI-powered autobiography platform
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Dashboard Header */}
      {!selectedClientId && (
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-5"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--accent)' }}>
              M
            </div>
            <span className="text-heading" style={{ color: 'var(--fg)' }}>Muse</span>
            <span className="badge badge-blue">Publisher</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn btn-ghost btn-icon">
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '13px' }}>
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-hidden">
        {selectedClientId ? (
          <div className="h-full flex flex-col">
            {/* Publisher interview bar */}
            <div className="flex-shrink-0 h-12 flex items-center justify-between px-4"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <button
                onClick={() => { setSelectedClientId(null); setMessages([]); setBookDraft(''); }}
                className="btn btn-ghost" style={{ fontSize: '13px' }}>
                ← Dashboard
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={toggleTheme} className="btn btn-ghost btn-icon">
                  {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                </button>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '13px' }}>
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ClientInterview
                clientName={clients.find(c => c.id === selectedClientId)?.name || ''}
                bookTitle={clients.find(c => c.id === selectedClientId)?.bookTitle || ''}
                messages={messages} input={input} loading={loading}
                isListening={isListening} isSpeaking={isSpeaking} isVoiceActive={isVoiceActive}
                wordCount={wordCount} bookDraft={bookDraft}
                onSend={handleSend} onInputChange={setInput}
                onToggleVoice={toggleVoiceAgent} onToggleListening={toggleListening}
                onSpeak={handleSpeak} speakingIndex={speakingIndex}
                isPublisher={true}
              />
            </div>
          </div>
        ) : (
          <PublisherDashboard
            clients={clients} onSelectClient={handleSelectClient}
            onAddClient={() => setShowAddClient(true)} onDeleteClient={handleDeleteClient}
            onCopyLink={handleCopyLink} onSendEmail={handleSendEmail}
            selectedClientId={selectedClientId}
          />
        )}
      </main>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowAddClient(false); }}>
          <div className="modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-title" style={{ color: 'var(--fg)' }}>New Client</h2>
              <button onClick={() => setShowAddClient(false)} className="btn btn-ghost btn-icon">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: newClientName, setter: setNewClientName, placeholder: 'John Smith', type: 'text' },
                { label: 'Email Address', value: newClientEmail, setter: setNewClientEmail, placeholder: 'john@example.com', type: 'email' },
                { label: 'Book Title', value: newClientBook, setter: setNewClientBook, placeholder: 'My Life Story', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-label block mb-1.5" style={{ color: 'var(--fg-muted)' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    placeholder={f.placeholder}
                    className="input"
                  />
                </div>
              ))}
              <div>
                <label className="text-label block mb-1.5" style={{ color: 'var(--fg-muted)' }}>Sport</label>
                <select
                  value={newClientSport}
                  onChange={e => setNewClientSport(e.target.value)}
                  className="input"
                >
                  <option value="baseball">⚾ Baseball</option>
                  <option value="football">🏈 Football</option>
                  <option value="basketball">🏀 Basketball</option>
                  <option value="cricket">🏏 Cricket</option>
                  <option value="boxing">🥊 Boxing</option>
                  <option value="athletics">🏃 Athletics</option>
                  <option value="tennis">🎾 Tennis</option>
                  <option value="other">🏆 Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddClient(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAddClient} className="btn btn-primary flex-1">
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
