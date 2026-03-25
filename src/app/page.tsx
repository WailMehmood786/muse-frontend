"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthScreen from '@/components/AuthScreen';
import PublisherDashboard from '@/components/PublisherDashboard';
import ClientInterview from '@/components/ClientInterview';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, LogOut, Users, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
}

type Message = { role: 'user' | 'ai'; text: string };

export default function Home() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const { theme, toggleTheme } = useTheme();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://muse-backend-production-29cd.up.railway.app';

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('muse_token');
    
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setUser(res.data.user);
        loadClients(token);
        loadAnalytics(token);
      } else {
        localStorage.removeItem('muse_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('muse_token');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (token?: string) => {
    const authToken = token || localStorage.getItem('muse_token');
    if (!authToken) return;
    
    try {
      const res = await axios.get(`${BACKEND_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (res.data.success) {
        setClients(res.data.clients);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const loadAnalytics = async (token?: string) => {
    const authToken = token || localStorage.getItem('muse_token');
    if (!authToken) return;
    
    try {
      const res = await axios.get(`${BACKEND_URL}/api/analytics`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    loadClients(loggedInUser.token);
    loadAnalytics(loggedInUser.token);
  };

  const handleLogout = () => {
    localStorage.removeItem('muse_token');
    setUser(null);
    setClients([]);
    setSelectedClient(null);
    toast.success('Logged out successfully');
  };

  const handleAddClient = async (clientData: any) => {
    const token = localStorage.getItem('muse_token');
    if (!token) return;
    
    try {
      const res = await axios.post(`${BACKEND_URL}/api/clients`, clientData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setClients(prev => [res.data.client, ...prev]);
        toast.success(`Client ${clientData.name} added successfully!`);
        setShowAddClient(false);
        
        // Copy link to clipboard
        await navigator.clipboard.writeText(res.data.client.uniqueLink);
        toast.success('Interview link copied to clipboard!');
      }
    } catch (error: any) {
      console.error('Failed to add client:', error);
      toast.error(error.response?.data?.error || 'Failed to add client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const token = localStorage.getItem('muse_token');
    if (!token) return;
    
    if (!confirm('Are you sure you want to delete this client? All their interview data will be permanently lost.')) {
      return;
    }
    
    try {
      await axios.delete(`${BACKEND_URL}/api/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      toast.success('Client deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete client:', error);
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleUpdateClient = async (clientId: string, updates: Partial<Omit<Client, 'status'>> & { status?: 'active' | 'completed' | 'pending' }) => {
    const token = localStorage.getItem('muse_token');
    if (!token) return;
    
    try {
      const res = await axios.put(`${BACKEND_URL}/api/clients/${clientId}`, updates, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setClients(prev => prev.map(c => c.id === clientId ? res.data.client : c));
        if (selectedClient?.id === clientId) {
          setSelectedClient(res.data.client);
        }
      }
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Interview mode
  if (selectedClient) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Header */}
        <div className="h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setSelectedClient(null)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Interview Component */}
        <div className="flex-1 overflow-hidden">
          <ClientInterview
            client={selectedClient}
            onUpdate={(updates) => handleUpdateClient(selectedClient.id, updates as any)}
          />
        </div>
      </div>
    );
  }

  // Dashboard mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Muse Publisher
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Stats */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-indigo-600" />
                <span className="text-xs text-gray-500">Total Clients</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalClients}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-green-600" />
                <span className="text-xs text-gray-500">Active</span>
              </div>
              <p className="text-2xl font-bold">{analytics.activeClients}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-purple-600" />
                <span className="text-xs text-gray-500">Completed</span>
              </div>
              <p className="text-2xl font-bold">{analytics.completedBooks}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={18} className="text-orange-600" />
                <span className="text-xs text-gray-500">Total Words</span>
              </div>
              <p className="text-2xl font-bold">{analytics.totalWords.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Component */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <PublisherDashboard
          clients={clients}
          onSelectClient={(c) => {
            // Find full client from state (has all required fields)
            const full = clients.find(x => x.id === c.id);
            if (full) setSelectedClient(full);
          }}
          onAddClient={() => setShowAddClient(true)}
          onDeleteClient={handleDeleteClient}
          onRefresh={() => loadClients()}
        />
      </div>
      
      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={handleAddClient}
        />
      )}
    </div>
  );
}

// Add Client Modal Component
function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [sport, setSport] = useState('baseball');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !bookTitle) {
      toast.error('Please fill all fields');
      return;
    }
    
    setLoading(true);
    await onAdd({ name, email, bookTitle, sport });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Add New Client</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Client Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Book Title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="My Amazing Story"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
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
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}