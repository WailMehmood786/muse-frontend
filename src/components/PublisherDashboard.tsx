"use client";

import { useState } from 'react';
import { Users, Plus, Search, Copy, Mail, Trash2, BookOpen, Clock, TrendingUp, CheckCircle, Loader2, BarChart3 } from 'lucide-react';

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
  onSelectClient: (id: string) => void;
  onAddClient: () => void;
  onDeleteClient: (id: string) => void;
  onCopyLink: (link: string) => void;
  onSendEmail: (email: string, link: string) => void;
  selectedClientId: string | null;
}

const sportEmoji: Record<string, string> = {
  baseball: '⚾', football: '🏈', basketball: '🏀',
  cricket: '🏏', boxing: '🥊', athletics: '🏃', tennis: '🎾', other: '🏆'
};

const statusConfig = {
  active:    { label: 'Active',    cls: 'badge-blue' },
  completed: { label: 'Completed', cls: 'badge-green' },
  pending:   { label: 'Pending',   cls: 'badge-gray' },
};

export default function PublisherDashboard({ clients, onSelectClient, onAddClient, onDeleteClient, onCopyLink, onSendEmail }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.bookTitle.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const avgProgress = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + c.progress, 0) / clients.length)
    : 0;

  const stats = [
    { label: 'Total', value: clients.length, icon: Users, color: '#5b5bd6' },
    { label: 'Active', value: clients.filter(c => c.status === 'active').length, icon: TrendingUp, color: '#16a34a' },
    { label: 'Done', value: clients.filter(c => c.status === 'completed').length, icon: CheckCircle, color: '#7c3aed' },
    { label: 'Avg Progress', value: `${avgProgress}%`, icon: BarChart3, color: '#d97706' },
  ];

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Delete this client and all their data?')) return;
    setDeletingId(id);
    await onDeleteClient(id);
    setDeletingId(null);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-display" style={{ color: 'var(--fg)' }}>Clients</h1>
            <p className="text-small mt-1" style={{ color: 'var(--fg-muted)' }}>
              {clients.length === 0 ? 'No clients yet' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onAddClient} className="btn btn-primary">
            <Plus size={15} />
            New Client
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <span className="stat-label">{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}18` }}>
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex-shrink-0 px-6 py-3 flex flex-col sm:flex-row gap-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--fg-faint)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients or books..."
            className="input input-search"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'completed', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-subtle)' }}>
        {filtered.length === 0 ? (
          <div className="empty-state h-full">
            <div className="empty-icon">
              <Users size={24} style={{ color: 'var(--fg-faint)' }} />
            </div>
            <h3 className="text-heading mb-1" style={{ color: 'var(--fg)' }}>
              {search ? 'No results' : 'No clients yet'}
            </h3>
            <p className="text-small mb-5" style={{ color: 'var(--fg-muted)' }}>
              {search ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!search && (
              <button onClick={onAddClient} className="btn btn-primary">
                <Plus size={14} /> Add Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((client, idx) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="card card-interactive p-5 group animate-fadeUp"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Top Row */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--accent-subtle)' }}>
                    {sportEmoji[client.sport || 'other'] || '🏆'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-heading truncate group-hover:text-[var(--accent)] transition-colors"
                      style={{ color: 'var(--fg)' }}>
                      {client.name}
                    </h3>
                    <p className="text-small truncate mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                      {client.bookTitle}
                    </p>
                  </div>
                  <span className={`badge flex-shrink-0 ${statusConfig[client.status].cls}`}>
                    {statusConfig[client.status].label}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-small" style={{ color: 'var(--fg-muted)' }}>
                      {client.wordCount.toLocaleString()} words
                    </span>
                    <span className="text-small font-semibold" style={{ color: 'var(--accent)' }}>
                      {client.progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${client.progress}%` }} />
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-small" style={{ color: 'var(--fg-faint)' }}>
                    <Clock size={11} />
                    {new Date(client.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onCopyLink(client.uniqueLink); }}
                      className="btn btn-ghost btn-icon"
                      title="Copy link">
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onSendEmail(client.email, client.uniqueLink); }}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--success)' }}
                      title="Send email">
                      <Mail size={13} />
                    </button>
                    <button
                      onClick={e => handleDelete(e, client.id)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--danger)' }}
                      title="Delete">
                      {deletingId === client.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
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
