"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClientInterview from '@/components/ClientInterview';

type Message = { role: 'user' | 'ai'; text: string };

type PageProps = { params: Promise<{ clientId: string }> };

export default function ClientInterviewPage({ params }: PageProps) {
  const { clientId } = React.use(params);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://muse-backend-production-29cd.up.railway.app';

  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookDraft, setBookDraft] = useState('');

  // Load client data
  useEffect(() => {
    const load = async () => {
      // 1. Try localStorage first (has existing messages)
      const saved = localStorage.getItem('muse_clients');
      if (saved) {
        const clients = JSON.parse(saved);
        const found = clients.find((c: any) => c.id === clientId);
        if (found) {
          setClient(found);
          if (found.messages?.length) setMessages(found.messages);
          if (found.bookDraft) setBookDraft(found.bookDraft);
          return;
        }
      }

      // 2. Try backend
      try {
        const res = await axios.get(`${BACKEND_URL}/api/clients/${clientId}`);
        if (res.data.success) {
          const c = res.data.client;
          setClient(c);
          if (c.messages?.length) setMessages(c.messages);
          if (c.bookDraft) setBookDraft(c.bookDraft);
          return;
        }
      } catch {}

      // 3. Build from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const name = urlParams.get('name');
      const book = urlParams.get('book');
      const sport = urlParams.get('sport');

      if (name && book) {
        setClient({
          id: clientId,
          name: decodeURIComponent(name),
          bookTitle: decodeURIComponent(book),
          sport: sport || 'baseball',
          messages: [],
          bookDraft: '',
          wordCount: 0,
          status: 'pending'
        });
      }
    };
    load();
  }, [clientId]);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (!client || messages.length === 0) return;
    const saved = localStorage.getItem('muse_clients');
    const clients = saved ? JSON.parse(saved) : [];
    const idx = clients.findIndex((c: any) => c.id === clientId);
    const updated = { ...client, messages, bookDraft, lastActive: new Date().toISOString() };
    if (idx >= 0) clients[idx] = updated;
    else clients.push(updated);
    localStorage.setItem('muse_clients', JSON.stringify(clients));
  }, [messages, bookDraft]);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-subtle)' }}>
        <div className="text-center max-w-sm card p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-title mb-2" style={{ color: 'var(--fg)' }}>Invalid Link</h2>
          <p className="text-body" style={{ color: 'var(--fg-muted)' }}>
            This interview link is not valid. Please contact your publisher for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen" style={{ background: 'var(--bg)' }}>
      <ClientInterview
        client={{
          id: client.id,
          name: client.name,
          bookTitle: client.bookTitle,
          sport: client.sport,
          messages,
          bookDraft,
          wordCount: bookDraft.split(/\s+/).filter(w => w.length > 0).length,
          status: 'active'
        }}
        onUpdate={(updates) => {
          if (updates.messages) setMessages(updates.messages as Message[]);
          if (updates.bookDraft !== undefined) setBookDraft(updates.bookDraft as string);
        }}
      />
    </div>
  );
}
