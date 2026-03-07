"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ClientInterview from '@/components/ClientInterview';
import { VoiceAgent } from '@/utils/voiceAgent';

type Message = {
  role: 'user' | 'ai';
  text: string;
};

type PageProps = {
  params: Promise<{ clientId: string }>
};

export default function ClientInterviewPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const clientId = unwrappedParams.clientId;
  
  // Backend URL helper
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://muse-backend-production-29cd.up.railway.app';
  
  const [client, setClient] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bookDraft, setBookDraft] = useState<string>('');

  const voiceAgentRef = useRef<VoiceAgent | null>(null);

  // Dynamic welcome message - AI will guide the conversation naturally
  const getWelcomeMessage = (clientName: string) => {
    return `Hey ${clientName}, thanks for sitting down with me. Let's start from the beginning - tell me about where you grew up.`;
  };

  // Initialize Voice Agent
  useEffect(() => {
    voiceAgentRef.current = new VoiceAgent({
      onListeningChange: setIsListening,
      onSpeakingChange: setIsSpeaking,
      onTranscript: setInput,
      onFinalTranscript: (text) => {
        handleSend(text);
      },
      onError: (error) => {
        console.error('Voice error:', error);
      }
    });

    // Configure voice agent
    voiceAgentRef.current.setSilenceMs(1200);
    voiceAgentRef.current.setLanguage('en-US');
    voiceAgentRef.current.setVoice({ rate: 0.92, pitch: 1.05, volume: 1.0 });

    return () => {
      voiceAgentRef.current?.stop();
    };
  }, []);

  // Load client data from URL parameters or backend/localStorage
  useEffect(() => {
    const loadClient = async () => {
      // First try to get from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const nameFromUrl = urlParams.get('name');
      const bookFromUrl = urlParams.get('book');
      const sportFromUrl = urlParams.get('sport');
      
      if (nameFromUrl && bookFromUrl) {
        // Create client from URL parameters
        console.log('Loading client from URL parameters');
        const clientData = {
          id: clientId,
          name: decodeURIComponent(nameFromUrl),
          email: '',
          bookTitle: decodeURIComponent(bookFromUrl),
          sport: sportFromUrl || 'baseball',
          uniqueLink: window.location.href,
          publisherId: 'publisher_1',
          sessionId: null,
          lastActive: new Date().toISOString(),
          status: 'pending' as const,
          progress: 0,
          messages: [],
          bookDraft: '',
          wordCount: 0
        };
        setClient(clientData);
        return;
      }
      
      // Try backend
      try {
        const res = await axios.get(`${BACKEND_URL}/api/clients/${clientId}`);
        if (res.data.success) {
          const clientData = res.data.client;
          setClient(clientData);
          if (clientData.messages) setMessages(clientData.messages);
          if (clientData.bookDraft) setBookDraft(clientData.bookDraft);
          if (clientData.sessionId) setSessionId(clientData.sessionId);
          return;
        }
      } catch (error) {
        console.log('Backend unavailable, trying localStorage');
      }
      
      // Try localStorage as fallback
      const savedClients = localStorage.getItem('muse_clients');
      if (savedClients) {
        const clients = JSON.parse(savedClients);
        const found = clients.find((c: any) => c.id === clientId);
        if (found) {
          console.log('Loading client from localStorage');
          setClient(found);
          if (found.messages) setMessages(found.messages);
          if (found.bookDraft) setBookDraft(found.bookDraft);
          if (found.sessionId) setSessionId(found.sessionId);
          return;
        }
      }
      
      // Client not found
      setClient(null);
    };
    loadClient();
  }, [clientId]);

  // Save messages to backend and localStorage
  useEffect(() => {
    const saveToBackend = async () => {
      if (client && messages.length > 0) {
        const wordCount = bookDraft.split(/\s+/).filter((w: string) => w.length > 0).length;
        const progress = Math.min(Math.floor(wordCount / 50), 100);
        
        // Save to localStorage first
        const savedClients = localStorage.getItem('muse_clients');
        if (savedClients) {
          const clients = JSON.parse(savedClients);
          const updated = clients.map((c: any) => 
            c.id === client.id ? { 
              ...c, 
              messages, 
              bookDraft,
              sessionId,
              lastActive: new Date().toISOString(),
              wordCount,
              progress,
              status: wordCount >= 5000 ? 'completed' : 'active'
            } : c
          );
          localStorage.setItem('muse_clients', JSON.stringify(updated));
        }
        
        // Try to sync with backend
        try {
          await axios.put(`${BACKEND_URL}/api/clients/${client.id}`, {
            messages,
            bookDraft,
            sessionId,
            wordCount,
            progress,
            status: wordCount >= 5000 ? 'completed' : 'active'
          });
        } catch (error) {
          console.error('Save to backend error (saved locally):', error);
        }
      }
    };
    
    // Debounce save
    const timer = setTimeout(saveToBackend, 2000);
    return () => clearTimeout(timer);
  }, [messages, bookDraft, sessionId, client]);

  // Handle Send Message
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Stop listening while processing
    if (voiceAgentRef.current && isListening) {
      voiceAgentRef.current.stopListening();
    }

    const newMsgs: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const athleteSport = client?.sport || 'general';
      
      const res = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: textToSend,
        userId: client?.id || null,
        history: messages,
        sessionId: sessionId,
        mode: 'Creative',
        sport: athleteSport
      });
      
      // Use the AI response directly (it's already in Kelly Cole style from backend)
      const aiReply = res.data.reply || "Tell me more about that.";

      const updatedMsgs: Message[] = [...newMsgs, { role: 'ai', text: aiReply }];
      setMessages(updatedMsgs);
      
      const newDraftContent = `**${client?.name || 'User'}:** ${textToSend}\n\n**Interviewer:** ${aiReply}`;
      setBookDraft(prev => prev ? prev + "\n\n---\n\n" + newDraftContent : newDraftContent);

      // Speak AI response if voice is active
      if (voiceAgentRef.current?.isVoiceActive()) {
        voiceAgentRef.current.enqueueSpeak(aiReply);
        voiceAgentRef.current.completeProcessing();
      }

      if (!sessionId) setSessionId(res.data.sessionId);
    } catch (err) {
      const errorMsg = "Connection issue. Please try again.";
      setMessages([...newMsgs, { role: 'ai', text: errorMsg }]);
      if (voiceAgentRef.current?.isVoiceActive()) {
        voiceAgentRef.current.speak(errorMsg);
        voiceAgentRef.current.completeProcessing();
      }
    } finally {
      setLoading(false);
    }
  };

  // Voice Agent Controls
  const toggleVoiceAgent = () => {
    if (isVoiceActive) {
      voiceAgentRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      const welcomeMsg = getWelcomeMessage(client?.name || 'there');
      
      voiceAgentRef.current?.start(welcomeMsg);
      setIsVoiceActive(true);
      
      if (messages.length === 0) {
        setMessages([{ role: 'ai', text: welcomeMsg }]);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceAgentRef.current?.stopListening();
    } else {
      voiceAgentRef.current?.startListening();
    }
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

  const wordCount = bookDraft.split(/\s+/).filter(w => w.length > 0).length;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        <div className="text-center max-w-md glass-card rounded-2xl p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gradient-animate">Invalid Interview Link</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This interview link is not valid or has expired. Please contact your publisher for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Simple Clean Header - No Back/Logout for Client */}
      <div className="glass-ultra border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl hdr-gradient-blue flex items-center justify-center shadow-glow-blue">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-gradient-animate">{client.bookTitle}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Interview with {client.name}</p>
          </div>
        </div>
      </div>

      {/* Interview Component */}
      <div className="flex-1 overflow-hidden">
        <ClientInterview
          clientName={client.name}
          bookTitle={client.bookTitle}
          messages={messages}
          input={input}
          loading={loading}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isVoiceActive={isVoiceActive}
          wordCount={wordCount}
          bookDraft={bookDraft}
          onSend={handleSend}
          onInputChange={setInput}
          onToggleVoice={toggleVoiceAgent}
          onToggleListening={toggleListening}
          onSpeak={handleSpeak}
          speakingIndex={speakingIndex}
          isPublisher={false}
        />
      </div>
    </div>
  );
}
