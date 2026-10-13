// Live Talk Manager: Alternating Turn-Taking (Half-Duplex) Voice Conversation
// When AI is speaking: User microphone is strictly OFF (preventing echo/feedback).
// When AI finishes speaking: User microphone turns ON automatically.
// When User finishes speaking: User microphone turns OFF immediately, AI prepares & speaks.

import { stopAllAudio } from './audio';

export interface LiveTalkConfig {
  language: string; // e.g., 'en-US', 'ur-PK', 'it-IT'
  onInterimSpeech: (text: string) => void;
  onUserMessage: (text: string) => void;
  onInterruption: () => void;
  onVolumeChange: (volume: number) => void;
  onStatusChange: (status: 'listening' | 'speaking' | 'thinking' | 'idle') => void;
  onError: (errorMsg: string) => void;
  onMicStateChange?: (isOn: boolean) => void;
}

export class LiveTalkSession {
  private active = false;
  private config: LiveTalkConfig;
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];

  // Strict Turn-Taking state
  private isAiSpeaking = false;
  private isProcessingTurn = false;
  private micActive = false;
  private currentTranscript = '';
  private silenceTimer: any = null;
  private isMuted = false;
  private volumeInterval: any = null;
  private isRecordingPushToTalk = false;
  private turnOnTimeout: any = null;

  constructor(config: LiveTalkConfig) {
    this.config = config;
  }

  public async start(): Promise<void> {
    this.active = true;
    this.currentTranscript = '';
    this.isAiSpeaking = false;
    this.isProcessingTurn = false;
    this.micActive = false;

    // Start visualizer volume ticker
    this.startVolumeTicker();

    // Prepare recognition engine
    this.setupSpeechRecognition();

    // Initially mic is OFF because AI starts with opening greeting
    this.turnMicOff();
  }

  /**
   * Turn the user's microphone ON (only when AI is NOT speaking and NOT processing a turn)
   */
  public turnMicOn(): void {
    if (!this.active || this.isMuted || this.isAiSpeaking || this.isProcessingTurn) {
      return;
    }

    if (this.turnOnTimeout) {
      clearTimeout(this.turnOnTimeout);
      this.turnOnTimeout = null;
    }

    this.micActive = true;
    this.currentTranscript = '';
    this.config.onMicStateChange?.(true);
    this.config.onStatusChange('listening');

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err: any) {
        // Recognition might already be running
      }
    }
  }

  /**
   * Turn the user's microphone OFF (when AI is speaking or when turn is being processed)
   */
  public turnMicOff(): void {
    if (this.turnOnTimeout) {
      clearTimeout(this.turnOnTimeout);
      this.turnOnTimeout = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.micActive = false;
    this.config.onMicStateChange?.(false);

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      try {
        this.recognition.stop();
      } catch {}
    }

    this.config.onInterimSpeech('');
    if (!this.isAiSpeaking && !this.isProcessingTurn && this.active) {
      this.config.onStatusChange('idle');
    }
  }

  private startVolumeTicker(): void {
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
    }

    this.volumeInterval = setInterval(() => {
      if (!this.active || this.isMuted) {
        this.config.onVolumeChange(0);
        return;
      }

      if (this.isAiSpeaking) {
        // Active AI speaking waves
        const vol = 45 + Math.floor(Math.random() * 45);
        this.config.onVolumeChange(vol);
      } else if (this.micActive && (this.currentTranscript.length > 0 || this.isRecordingPushToTalk)) {
        // Active user speaking waves
        const vol = 50 + Math.floor(Math.random() * 45);
        this.config.onVolumeChange(vol);
      } else if (this.micActive) {
        // Ambient listening breathing
        const vol = 12 + Math.floor(Math.random() * 12);
        this.config.onVolumeChange(vol);
      } else {
        // Mic is OFF
        this.config.onVolumeChange(0);
      }
    }, 100);
  }

  private setupSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.info('Native SpeechRecognition unavailable, using MediaRecorder fallback');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = this.config.language || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (this.micActive) {
          this.config.onStatusChange('listening');
        }
      };

      recognition.onresult = (event: any) => {
        // Ignore any speech frames if mic is supposed to be OFF
        if (!this.active || this.isMuted || !this.micActive || this.isAiSpeaking || this.isProcessingTurn) {
          return;
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const candidateText = (final || interim).trim();

        if (candidateText && this.micActive) {
          this.currentTranscript = candidateText;
          this.config.onInterimSpeech(candidateText);
          this.config.onStatusChange('listening');

          // Reset silence timer for user completion
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
          }

          // When user pauses speaking (650ms for final, 900ms for interim): commit turn!
          const timeoutMs = final ? 650 : 900;
          this.silenceTimer = setTimeout(() => {
            this.commitUserTurn();
          }, timeoutMs);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error || '';
        if (errType === 'no-speech' || errType === 'aborted') {
          return;
        }

        console.info('Live recognition event:', errType);
        if (errType === 'not-allowed') {
          this.config.onError('Microphone access is required. Please grant permissions.');
        }
      };

      recognition.onend = () => {
        // If mic is still supposed to be ON, keep it alive
        if (this.active && this.micActive && !this.isAiSpeaking && !this.isProcessingTurn) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (this.active && this.micActive && !this.isAiSpeaking && !this.isProcessingTurn) {
                try {
                  recognition.start();
                } catch {}
              }
            }, 250);
          }
        }
      };

      this.recognition = recognition;
    } catch (err: any) {
      console.warn('SpeechRecognition initialization notice:', err);
    }
  }

  /**
   * Finalize user speech turn:
   * 1. Turn OFF the microphone immediately.
   * 2. Send the transcribed text to AI.
   * 3. AI will answer through speakers.
   */
  public commitUserTurn(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const text = this.currentTranscript.trim();
    if (!text || this.isProcessingTurn) {
      return;
    }

    // 1. Immediately turn OFF the microphone so it doesn't hear anything
    this.turnMicOff();

    this.currentTranscript = '';
    this.isProcessingTurn = true;
    this.config.onStatusChange('thinking');
    this.config.onUserMessage(text);

    // Watchdog safety timeout: if response fails or hangs, reset state after 15s
    setTimeout(() => {
      if (this.isProcessingTurn && !this.isAiSpeaking) {
        this.isProcessingTurn = false;
        if (this.active) {
          this.turnMicOn();
        }
      }
    }, 15000);
  }

  /**
   * Manually commit a text turn (e.g. from the in-call text input)
   */
  public commitManualTurn(text: string): void {
    const clean = text.trim();
    if (!clean) return;

    if (this.isAiSpeaking) {
      this.triggerInterruption('manual-text');
    }

    // Immediately turn OFF mic
    this.turnMicOff();

    this.currentTranscript = '';
    this.isProcessingTurn = true;
    this.config.onStatusChange('thinking');
    this.config.onUserMessage(clean);

    setTimeout(() => {
      if (this.isProcessingTurn && !this.isAiSpeaking) {
        this.isProcessingTurn = false;
        if (this.active) {
          this.turnMicOn();
        }
      }
    }, 15000);
  }

  /**
   * Push-to-Talk Recording: records microphone audio directly and transcribes with Gemini
   */
  public async startPushToTalk(): Promise<void> {
    if (this.isRecordingPushToTalk) return;
    this.isRecordingPushToTalk = true;

    if (this.isAiSpeaking) {
      this.triggerInterruption('push-to-talk-started');
    }

    try {
      this.turnMicOff();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      this.recordedChunks = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      recorder.start(200);
      this.micActive = true;
      this.config.onMicStateChange?.(true);
      this.config.onStatusChange('listening');
      this.config.onInterimSpeech(
        this.config.language === 'ur-PK' ? 'سن رہا ہوں... بول کر چھوڑیں' : 'Listening... release to send'
      );
    } catch (err: any) {
      console.warn('Push-to-talk microphone error:', err);
      this.isRecordingPushToTalk = false;
      this.config.onError('Could not open microphone for recording.');
    }
  }

  public async stopPushToTalk(): Promise<void> {
    if (!this.isRecordingPushToTalk || !this.mediaRecorder) return;
    this.isRecordingPushToTalk = false;
    this.micActive = false;
    this.config.onMicStateChange?.(false);

    return new Promise((resolve) => {
      const recorder = this.mediaRecorder;
      if (!recorder) {
        resolve();
        return;
      }

      recorder.onstop = async () => {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        if (this.recordedChunks.length === 0) {
          this.config.onInterimSpeech('');
          this.turnMicOn();
          resolve();
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
        this.recordedChunks = [];

        this.config.onStatusChange('thinking');
        this.config.onInterimSpeech(
          this.config.language === 'ur-PK' ? 'آواز سمجھی جا رہی ہے...' : 'Transcribing voice...'
        );

        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = (reader.result as string)?.split(',')[1];
            if (!base64Data) {
              this.config.onInterimSpeech('');
              this.turnMicOn();
              resolve();
              return;
            }

            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType }),
              });
              const data = await res.json();
              const transcribed = (data?.text || '').trim();

              if (transcribed) {
                this.config.onInterimSpeech('');
                this.commitManualTurn(transcribed);
              } else {
                this.config.onInterimSpeech('');
                this.turnMicOn();
              }
            } catch (apiErr) {
              console.warn('Transcription API notice:', apiErr);
              this.config.onInterimSpeech('');
              this.turnMicOn();
            }
            resolve();
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          this.config.onInterimSpeech('');
          this.turnMicOn();
          resolve();
        }
      };

      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });
  }

  /**
   * User interrupts AI speaking (e.g. by tapping sphere or stop button)
   */
  public triggerInterruption(reason = 'user-action'): void {
    if (this.isAiSpeaking) {
      this.isAiSpeaking = false;
      this.isProcessingTurn = false;
      stopAllAudio();
      this.config.onInterruption();

      // Immediately turn user's mic ON so they can speak!
      this.turnMicOn();
    }
  }

  /**
   * Inform the session that AI has started or stopped speaking:
   * - When speaking = true: User mic is strictly OFF!
   * - When speaking = false: User mic turns ON after small echo-clear delay.
   */
  public setAiSpeaking(speaking: boolean): void {
    this.isAiSpeaking = speaking;
    this.isProcessingTurn = false;

    if (speaking) {
      // AI is speaking: turn user mic OFF immediately!
      this.turnMicOff();
      this.config.onStatusChange('speaking');
    } else if (this.active) {
      // AI has stopped speaking (چپ کر گیا): turn user mic ON!
      if (this.turnOnTimeout) clearTimeout(this.turnOnTimeout);
      this.turnOnTimeout = setTimeout(() => {
        if (this.active && !this.isAiSpeaking && !this.isProcessingTurn) {
          this.turnMicOn();
        }
      }, 250);
    }
  }

  /**
   * Manually control turn-processing lock state
   */
  public setProcessingTurn(processing: boolean): void {
    this.isProcessingTurn = processing;
    if (processing) {
      this.turnMicOff();
    } else if (!this.isAiSpeaking && this.active) {
      this.turnMicOn();
    }
  }

  /**
   * Update language dynamically without stopping session
   */
  public setLanguage(lang: string): void {
    this.config.language = lang;
    if (this.recognition) {
      try {
        this.recognition.lang = lang;
      } catch {}
    }
  }

  /**
   * Mute or unmute the microphone input in real-time
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.turnMicOff();
    } else if (!this.isAiSpeaking && !this.isProcessingTurn && this.active) {
      this.turnMicOn();
    }
  }

  /**
   * Stop the live talk session and clean up resources
   */
  public stop(): void {
    this.active = false;
    this.isAiSpeaking = false;
    this.isProcessingTurn = false;
    this.isRecordingPushToTalk = false;

    this.turnMicOff();

    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    stopAllAudio();
    this.config.onStatusChange('idle');
  }

  public isRunning(): boolean {
    return this.active;
  }

  public isUserMicActive(): boolean {
    return this.micActive;
  }
}
