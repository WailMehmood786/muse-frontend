"use client";

import { useState } from 'react';
import { Users, Plus, Search, Copy, Mail, Trash2, BookOpen, Clock, TrendingUp, CheckCircle, Loader2, BarChart3, RefreshCw } from 'lucide-react';
import ClientCard from './ClientCard';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  bookTitle: string;
  uniqueLink: string;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  wordCount: number;
  lastActive: string;
  sport?: string;
}

interface Props {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onAddClient: () => void;
  onDeleteClient: (id: string) => void;
  onRefresh: () => void;
}

export default function PublisherDashboard({ clients, onSelectClient, onAddClient, onDeleteClient, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.bookTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    completed: clients.filter(c => c.status === 'completed').length,
    totalWords: clients.reduce((sum, c) => sum + (c.wordCount || 0), 0),
    avgProgress: clients.length > 0 
      ? Math.round(clients.reduce((sum, c) => sum + (c.progress || 0), 0) / clients.length)
      : 0
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Interview link copied!');
  };

  const handleSendEmail = (email: string, link: string) => {
    const subject = encodeURIComponent('Your Book Interview Link');
    const body = encodeURIComponent(`Dear Client,\n\nHere is your personal interview link to start your book journey:\n\n${link}\n\nClick the link to begin your interview. The AI will guide you through telling your story.\n\nBest regards,\nYour Publisher`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    toast.success('Email client opened');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-gray-500">Manage your authors and their books</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onAddClient}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Users size={18} className="text-indigo-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={18} className="text-purple-600" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <BookOpen size={18} className="text-orange-600" />
            <span className="text-xs text-gray-500">Total Words</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={18} className="text-blue-600" />
            <span className="text-xs text-gray-500">Avg Progress</span>
          </div>
          <p className="text-2xl font-bold">{stats.avgProgress}%</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or book title..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'active', 'completed', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No clients found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!search && (
            <button
              onClick={onAddClient}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus size={16} className="inline mr-2" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={() => onSelectClient(client)}
              onCopyLink={() => handleCopyLink(client.uniqueLink)}
              onSendEmail={() => handleSendEmail(client.email, client.uniqueLink)}
              onDelete={() => onDeleteClient(client.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}