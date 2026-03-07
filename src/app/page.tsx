"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PublisherDashboard from '@/components/PublisherDashboard';
import ClientInterview from '@/components/ClientInterview';
import { VoiceAgent } from '@/utils/voiceAgent';
import { Sun, Moon, LogOut } from 'lucide-react';

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
    // Removed setStopRecognitionOnSpeak - not needed anymore
    voiceAgentRef.current.setSilenceMs(1200);
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
    try {
      const token = localStorage.getItem('muse_publisher_token');
      
      if (!token) {
        console.log('No token found, loading from localStorage');
        const savedClients = localStorage.getItem('muse_clients');
        if (savedClients) {
          setClients(JSON.parse(savedClients));
        }
        return;
      }

      console.log('Loading clients from backend with token');
      
      const res = await axios.get(`${BACKEND_URL}/api/clients?publisherId=publisher_1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data.success) {
        console.log(`✅ Loaded ${res.data.clients.length} clients from backend`);
        setClients(res.data.clients);
        localStorage.setItem('muse_clients', JSON.stringify(res.data.clients));
      }
    } catch (error: any) {
      console.error('Backend unavailable:', error?.response?.data || error.message);
      
      if (error?.response?.status === 401) {
        console.log('Token expired, clearing auth');
        localStorage.removeItem('muse_publisher_token');
      }
      
      // Fallback to localStorage
      const savedClients = localStorage.getItem('muse_clients');
      if (savedClients) {
        setClients(JSON.parse(savedClients));
      }
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
    
    // Save to backend first (primary storage)
    try {
      await axios.put(`${BACKEND_URL}/api/clients/${clientId}`, {
        messages: msgs,
        bookDraft: draft,
        wordCount,
        progress,
        status: progress >= 100 ? 'completed' : 'active'
      });
      // Sync to localStorage as backup
      localStorage.setItem('muse_clients', JSON.stringify(updatedClients));
      console.log('✅ Client data saved to backend');
    } catch (error: any) {
      console.error('Backend save failed, using localStorage:', error);
      // Fallback: save to localStorage only
      localStorage.setItem('muse_clients', JSON.stringify(updatedClients));
    }
  };

  const toggleVoiceAgent = () => {
    if (isVoiceActive) {
      voiceAgentRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      const client = clients.find(c => c.id === selectedClientId);
      const clientName = isPublisher ? client?.name : user?.name;
      const welcomeMsg = getWelcomeMessage(clientName || 'there');
      voiceAgentRef.current?.start(welcomeMsg);
      setIsVoiceActive(true);
      setMessages([{ role: 'ai', text: welcomeMsg }]);
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
    if (!token) {
      alert('❌ Session expired. Please login again.');
      handleLogout();
      return;
    }

    console.log('Creating client with token:', token.substring(0, 20) + '...');

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
          }
        }
      );
      
      console.log('Client created successfully:', res.data);
      
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
        alert(`✅ Client ${serverClient.name} added!\n\n📋 Link copied to clipboard.\n\n🔗 Share this link with your client.`);
      }
    } catch (error: any) {
      console.error('Failed to create client:', error);
      console.error('Error response:', error?.response?.data);
      
      if (error?.response?.status === 401) {
        alert('❌ Session expired. Please login again.');
        handleLogout();
      } else {
        const errorMsg = error?.response?.data?.error || 'Failed to create client';
        alert(`❌ ${errorMsg}\n\nPlease try again.`);
      }
    }
  };

  const handleSelectClient = (clientId: string) => setSelectedClientId(clientId);
  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Delete this client and all their data?')) {
      const updatedClients = clients.filter(c => c.id !== clientId);
      setClients(updatedClients);
      
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
        setMessages([]);
        setBookDraft('');
      }
      
      // Delete from backend first
      try {
        await axios.delete(`${BACKEND_URL}/api/clients/${clientId}`);
        console.log('✅ Client deleted from backend');
      } catch (error) {
        console.error('Backend delete failed:', error);
      }
      
      // Update localStorage as backup
      localStorage.setItem('muse_clients', JSON.stringify(updatedClients));
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl text-white font-bold">M</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Muse Publisher
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter password to access dashboard
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <form onSubmit={handlePublisherLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter publisher password"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
                  autoFocus
                />
                {authError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Verifying...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-10 glass-ultra">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 hdr-gradient-blue rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-ultra neon-blue">
            M
          </div>
          <div>
            <span className="font-bold text-lg text-gradient-animate">Muse</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">Publisher</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedClientId && (
            <button onClick={() => setSelectedClientId(null)} className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all hover-lift">
              ← Dashboard
            </button>
          )}
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all hover-lift">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all hover-lift text-sm">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        {selectedClientId ? (
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
        ) : (
          <PublisherDashboard
            clients={clients} onSelectClient={handleSelectClient}
            onAddClient={() => setShowAddClient(true)} onDeleteClient={handleDeleteClient}
            onCopyLink={handleCopyLink} onSendEmail={handleSendEmail}
            selectedClientId={selectedClientId}
          />
        )}
      </main>

      {showAddClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 shadow-ultra glass-ultra">
            <h2 className="text-2xl font-bold mb-6 text-gradient-animate">Add New Client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name</label>
                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Book Title</label>
                <input type="text" value={newClientBook} onChange={(e) => setNewClientBook(e.target.value)} placeholder="My Amazing Story"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sport</label>
                <select value={newClientSport} onChange={(e) => setNewClientSport(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  <option value="baseball">Baseball ⚾</option>
                  <option value="football">Football 🏈</option>
                  <option value="basketball">Basketball 🏀</option>
                  <option value="cricket">Cricket 🏏</option>
                  <option value="boxing">Boxing 🥊</option>
                  <option value="athletics">Athletics 🏃</option>
                  <option value="tennis">Tennis 🎾</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddClient(false)}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover-lift">
                Cancel
              </button>
              <button onClick={handleAddClient}
                className="flex-1 px-4 py-3 hdr-gradient-blue text-white rounded-xl hover:shadow-lg transition-all hover-lift-ultra neon-blue">
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
