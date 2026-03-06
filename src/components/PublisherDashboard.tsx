"use client";

import { useState } from 'react';
import { Users, Plus, Search, Copy, Mail, Trash2, BookOpen, Clock, Activity, CheckCircle, Target } from 'lucide-react';

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
  onSelectClient: (clientId: string) => void;
  onAddClient: () => void;
  onDeleteClient: (clientId: string) => void;
  onCopyLink: (link: string) => void;
  onSendEmail: (email: string, link: string) => void;
  selectedClientId: string | null;
}

export default function PublisherDashboard({ clients, onSelectClient, onAddClient, onDeleteClient, onCopyLink, onSendEmail }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  const stats = [
    { label: 'Total', value: clients.length, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Active', value: clients.filter(c => c.status === 'active').length, icon: Activity, color: 'from-green-500 to-green-600' },
    { label: 'Completed', value: clients.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'from-purple-500 to-purple-600' },
    { label: 'Progress', value: `${clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.progress, 0) / clients.length) : 0}%`, icon: Target, color: 'from-orange-500 to-orange-600' }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || client.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-6 glass-ultra">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient-animate">Publisher Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your clients</p>
          </div>
          <button onClick={onAddClient} className="flex items-center gap-2 px-6 py-3 hdr-gradient-blue text-white rounded-xl hover:shadow-lg hover-lift-ultra neon-blue">
            <Plus size={20} />
            Add Client
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-4 glass-ultra">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'completed', 'pending'].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm ${filterStatus === status ? 'hdr-gradient-blue text-white shadow-lg neon-blue' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Users size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clients found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{searchQuery ? 'Try different search' : 'Add your first client'}</p>
            {!searchQuery && (
              <button onClick={onAddClient} className="px-6 py-3 hdr-gradient-blue text-white rounded-xl hover:shadow-lg hover-lift-ultra neon-blue">
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div key={client.id} onClick={() => onSelectClient(client.id)}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-xl hover-lift cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600">{client.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.bookTitle}</p>
                  </div>
                </div>
                {client.sport && (
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                      {client.sport.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-xs font-bold text-blue-600">{client.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full hdr-gradient-blue" style={{ width: `${client.progress}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {client.wordCount.toLocaleString()} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(client.lastActive).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    client.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                    client.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); onCopyLink(client.uniqueLink); }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg">
                      <Copy size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSendEmail(client.email, client.uniqueLink); }}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 rounded-lg">
                      <Mail size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
