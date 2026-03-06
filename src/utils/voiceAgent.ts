// Voice Agent - ChatGPT Style: Auto-listens after AI speaks

export class VoiceAgent {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private isActive: boolean = false;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private isProcessing: boolean = false;
  private speakQueue: string[] = [];
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Settings
  private silenceTimeout: number = 1500; // 1.5 seconds
  private voiceRate: number = 0.9;
  private voicePitch: number = 1.0;
  private voiceVolume: number = 1.0;
  private voiceLang: string = 'en-US';
  private preferredVoiceName: string | null = null;
  
  // Callbacks
  private onListeningChange: (listening: boolean) => void;
  private onSpeakingChange: (speaking: boolean) => void;
  private onTranscript: (text: string) => void;
  private onFinalTranscript: (text: string) => void;
  private onError: (error: string) => void;

  constructor(callbacks: {
    onListeningChange: (listening: boolean) => void;
    onSpeakingChange: (speaking: boolean) => void;
    onTranscript: (text: string) => void;
    onFinalTranscript: (text: string) => void;
    onError: (error: string) => void;
  }) {
    this.onListeningChange = callbacks.onListeningChange;
    this.onSpeakingChange = callbacks.onSpeakingChange;
    this.onTranscript = callbacks.onTranscript;
    this.onFinalTranscript = callbacks.onFinalTranscript;
    this.onError = callbacks.onError;
    this.synthesis = window.speechSynthesis;
    
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.onError('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.voiceLang;
    this.recognition.maxAlternatives = 1;

    // Recognition event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChange(false);
      
      // Auto-restart if voice is active and not speaking
      if (this.isActive && !this.isSpeaking && !this.isProcessing) {
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking && !this.isProcessing) {
            this.startListening();
          }
        }, 100);
      }
    };

    let finalTranscript = '';

    this.recognition.onresult = (event: any) => {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
      }

      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update with current transcript
      const currentText = (finalTranscript + ' ' + interimTranscript).trim();
      this.onTranscript(currentText);

      // Set silence timer for final transcript
      this.silenceTimer = setTimeout(() => {
        if (finalTranscript.trim() && !this.isProcessing) {
          this.isProcessing = true;
          this.onFinalTranscript(finalTranscript.trim());
          finalTranscript = '';
          
          // Stop listening after final transcript
          if (this.isListening) {
            this.stopListening();
          }
          
          setTimeout(() => {
            this.isProcessing = false;
          }, 500);
        }
      }, this.silenceTimeout);
    };

    this.recognition.onerror = (event: any) => {
      console.log('Recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        // Ignore - just means user didn't speak
        return;
      }
      
      this.onError(`Recognition error: ${event.error}`);
      
      // Restart on certain errors
      if (['network', 'audio-capture', 'aborted'].includes(event.error)) {
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking) {
            this.startListening();
          }
        }, 1000);
      }
    };
  }

  // Start voice agent
  start(welcomeMessage?: string) {
    this.isActive = true;
    
    if (welcomeMessage) {
      this.speak(welcomeMessage);
    } else {
      this.startListening();
    }
  }

  // Stop voice agent completely
  stop() {
    this.isActive = false;
    this.stopListening();
    this.stopSpeaking();
    this.speakQueue = [];
    this.isProcessing = false;
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
  }

  // Start listening for user input
  startListening() {
    if (!this.recognition || this.isSpeaking || !this.isActive) return;
    
    try {
      this.recognition.start();
    } catch (e) {
      // Already started, ignore
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped, ignore
      }
    }
  }

  // Speak text (AI response)
  speak(text: string, onComplete?: () => void) {
    if (!this.synthesis) {
      if (onComplete) onComplete();
      return;
    }

    // Add to queue
    this.speakQueue.push(text);
    
    // Start processing queue if not already
    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.speakQueue.length === 0 || !this.isActive) {
      this.isSpeaking = false;
      this.onSpeakingChange(false);
      
      // ✅ AUTO-RESUME LISTENING after speaking (ChatGPT style)
      if (this.isActive && !this.isProcessing) {
        setTimeout(() => {
          this.startListening();
        }, 300);
      }
      return;
    }

    this.isSpeaking = true;
    this.onSpeakingChange(true);
    
    // Stop listening while speaking
    this.stopListening();

    const text = this.speakQueue.shift()!;
    const utterance = new SpeechSynthesisUtterance(this.cleanText(text));
    
    // Configure voice
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;
    utterance.volume = this.voiceVolume;
    utterance.lang = this.voiceLang;

    // Get best available voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = (this.preferredVoiceName
      ? voices.find(v => v.name === this.preferredVoiceName)
      : null) || voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      // Process next in queue
      setTimeout(() => {
        this.processQueue();
      }, 100);
    };

    utterance.onerror = () => {
      setTimeout(() => {
        this.processQueue();
      }, 100);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  // Stop speaking
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onSpeakingChange(false);
  }

  // Enqueue multiple texts
  enqueueSpeak(text: string) {
    this.speakQueue.push(text);
    if (!this.isSpeaking && this.isActive) {
      this.processQueue();
    }
  }

  // Mark processing complete (for final transcript)
  completeProcessing() {
    this.isProcessing = false;
  }

  // Check if voice is active
  isVoiceActive(): boolean {
    return this.isActive;
  }

  // Clean text for TTS
  private cleanText(text: string): string {
    return text
      .replace(/[*_~`#\[\]]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Settings
  setSilenceMs(ms: number) {
    this.silenceTimeout = Math.max(500, Math.min(3000, ms));
  }

  setLanguage(lang: string) {
    this.voiceLang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  setVoice(options: { rate?: number; pitch?: number; volume?: number; name?: string }) {
    if (options.rate !== undefined) this.voiceRate = options.rate;
    if (options.pitch !== undefined) this.voicePitch = options.pitch;
    if (options.volume !== undefined) this.voiceVolume = options.volume;
    if (options.name !== undefined) this.preferredVoiceName = options.name || null;
  }
}

// Helper to check support
export function checkVoiceSupport() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return {
    recognition: !!SpeechRecognition,
    synthesis: !!window.speechSynthesis,
    supported: !!SpeechRecognition && !!window.speechSynthesis
  };
}
