// Voice Agent with improved reliability and error handling

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
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  // Settings
  private silenceTimeout: number = 2000;
  private voiceRate: number = 0.92;
  private voicePitch: number = 1.05;
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
      this.onError('Speech recognition is not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.voiceLang;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningChange(true);
      this.retryCount = 0;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChange(false);
      
      // Auto-restart if voice is active and not speaking
      if (this.isActive && !this.isSpeaking && !this.isProcessing) {
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking && !this.isProcessing && !this.isListening) {
            this.startListening();
          }
        }, 500);
      }
    };

    let finalTranscript = '';
    let lastProcessedTranscript = '';
    let processingTimeout: NodeJS.Timeout | null = null;
    let lastProcessedTime = 0;

    this.recognition.onresult = (event: any) => {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      if (processingTimeout) clearTimeout(processingTimeout);

      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentText = (finalTranscript + ' ' + interimTranscript).trim();
      this.onTranscript(currentText);

      this.silenceTimer = setTimeout(() => {
        const trimmedTranscript = finalTranscript.trim();
        const now = Date.now();
        
        if (trimmedTranscript && 
            trimmedTranscript !== lastProcessedTranscript && 
            !this.isProcessing &&
            trimmedTranscript.length > 3 &&
            (now - lastProcessedTime) > 1500) {
          
          this.isProcessing = true;
          lastProcessedTranscript = trimmedTranscript;
          lastProcessedTime = now;
          
          processingTimeout = setTimeout(() => {
            this.onFinalTranscript(trimmedTranscript);
            finalTranscript = '';
            
            if (this.isListening) {
              this.stopListening();
            }
            
            setTimeout(() => {
              this.isProcessing = false;
            }, 1500);
          }, 300);
        }
      }, this.silenceTimeout);
    };

    this.recognition.onerror = (event: any) => {
      console.log('Recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        return;
      }
      
      if (event.error === 'network' && this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          if (this.isActive && !this.isSpeaking) {
            this.startListening();
          }
        }, 1000);
      } else if (event.error !== 'aborted') {
        this.onError(`Recognition error: ${event.error}`);
      }
    };
  }

  start(welcomeMessage?: string) {
    this.isActive = true;
    
    if (welcomeMessage) {
      this.speak(welcomeMessage);
    } else {
      this.startListening();
    }
  }

  stop() {
    this.isActive = false;
    this.stopListening();
    this.stopSpeaking();
    this.speakQueue = [];
    this.isProcessing = false;
    
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
  }

  startListening() {
    if (!this.recognition || this.isSpeaking || !this.isActive || this.isListening) return;
    
    try {
      this.recognition.start();
    } catch (e) {
      // Already started or error
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }

  speak(text: string, onComplete?: () => void) {
    if (!this.synthesis) {
      if (onComplete) onComplete();
      return;
    }

    this.speakQueue.push(text);
    
    if (!this.isSpeaking) {
      this.processQueue(onComplete);
    }
  }

  private processQueue(onComplete?: () => void) {
    if (this.speakQueue.length === 0 || !this.isActive) {
      this.isSpeaking = false;
      this.onSpeakingChange(false);
      
      if (this.isActive && !this.isProcessing) {
        setTimeout(() => this.startListening(), 200);
      }
      if (onComplete) onComplete();
      return;
    }

    this.isSpeaking = true;
    this.onSpeakingChange(true);
    this.stopListening();

    const text = this.speakQueue.shift()!;
    const utterance = new SpeechSynthesisUtterance(this.cleanText(text));
    
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;
    utterance.volume = this.voiceVolume;
    utterance.lang = this.voiceLang;

    const voices = this.synthesis.getVoices();
    const preferredVoice = (this.preferredVoiceName
      ? voices.find(v => v.name === this.preferredVoiceName)
      : null) || voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setTimeout(() => this.processQueue(onComplete), 100);
    };

    utterance.onerror = () => {
      setTimeout(() => this.processQueue(onComplete), 100);
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onSpeakingChange(false);
  }

  enqueueSpeak(text: string) {
    this.speakQueue.push(text);
    if (!this.isSpeaking && this.isActive) {
      this.processQueue();
    }
  }

  completeProcessing() {
    this.isProcessing = false;
  }

  isVoiceActive(): boolean {
    return this.isActive;
  }

  private cleanText(text: string): string {
    return text
      .replace(/[*_~`#\[\]]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

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
    if (options.name !== undefined) this.preferredVoiceName = options.name;
  }
}

export function checkVoiceSupport() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return {
    recognition: !!SpeechRecognition,
    synthesis: !!window.speechSynthesis,
    supported: !!SpeechRecognition && !!window.speechSynthesis
  };
}