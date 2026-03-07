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
    { label: 'Total', value: clients.length, icon: Users, color: 'bg-blue-600' },
    { label: 'Active', value: clients.filter(c => c.status === 'active').length, icon: Activity, color: 'bg-green-600' },
    { label: 'Completed', value: clients.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'bg-purple-600' },
    { label: 'Progress', value: `${clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.progress, 0) / clients.length) : 0}%`, icon: Target, color: 'bg-orange-600' }
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || client.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#212121]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-[#212121]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Publisher Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your clients</p>
          </div>
          <button onClick={onAddClient} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <Plus size={20} />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-50 dark:bg-[#2f2f2f] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#212121]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-500" 
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'completed', 'pending'].map((status) => (
              <button 
                key={status} 
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-[#2f2f2f] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#171717]">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
              <Users size={40} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No clients found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <button 
                onClick={onAddClient} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => onSelectClient(client.id)}
                className="bg-white dark:bg-[#2f2f2f] rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group">
                
                {/* Client Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.bookTitle}</p>
                  </div>
                </div>

                {/* Sport Badge */}
                {client.sport && (
                  <div className="mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      {client.sport.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{client.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" 
                      style={{ width: `${client.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {client.wordCount.toLocaleString()} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(client.lastActive).toLocaleDateString()}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    client.status === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : client.status === 'active' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCopyLink(client.uniqueLink); }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                      title="Copy Link">
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSendEmail(client.email, client.uniqueLink); }}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                      title="Send Email">
                      <Mail size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title="Delete">
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
