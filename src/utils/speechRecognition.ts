// Speech recognition utility with Web Speech API and MediaRecorder fallback
// Supports English (en-US), Italian (it-IT), Urdu (ur-PK), and multilingual audio transcription

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onVolumeChange?: (volume: number) => void;
}

let activeRecognition: any = null;
let activeMediaStream: MediaStream | null = null;
let activeMediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;
let animFrameId: number | null = null;
let recordedAudioChunks: Blob[] = [];
let simulatedVolumeInterval: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Start voice input. Tries Web Speech API first. If that fails or is blocked by iframe,
 * smoothly falls back to MediaRecorder with Gemini transcription.
 */
export function startSpeechRecognition(
  callbacks: RecognitionCallbacks,
  lang = 'en-US'
): () => void {
  stopSpeechRecognition();

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  // If browser doesn't have Web Speech API, use MediaRecorder directly
  if (!SpeechRecognition) {
    if (isMediaRecorderSupported()) {
      return startMediaRecorderFallback(callbacks, lang);
    }
    callbacks.onError(
      'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.'
    );
    return () => {};
  }

  let hasStarted = false;
  let hasReceivedResult = false;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      hasStarted = true;
      callbacks.onStart();

      // Simulate dynamic volume activity for the visualizer without locking audio hardware
      let base = 25;
      simulatedVolumeInterval = setInterval(() => {
        const jitter = Math.floor(Math.random() * 45);
        callbacks.onVolumeChange?.(Math.min(95, base + jitter));
      }, 120);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        hasReceivedResult = true;
        callbacks.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        hasReceivedResult = true;
        callbacks.onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Web Speech Recognition error:', event.error);
      if (simulatedVolumeInterval) {
        clearInterval(simulatedVolumeInterval);
        simulatedVolumeInterval = null;
      }

      // If speech recognition is blocked inside iframe or network fails, try MediaRecorder fallback
      if (
        (event.error === 'not-allowed' ||
          event.error === 'network' ||
          event.error === 'service-not-allowed' ||
          event.error === 'audio-capture') &&
        !hasReceivedResult &&
        isMediaRecorderSupported()
      ) {
        console.info('Falling back to direct MediaRecorder voice capture...');
        activeRecognition = null;
        startMediaRecorderFallback(callbacks, lang);
        return;
      }

      if (event.error === 'not-allowed') {
        callbacks.onError(
          'Microphone permission denied. Please click the lock/settings icon in the browser URL bar to allow microphone access.'
        );
      } else if (event.error !== 'no-speech') {
        callbacks.onError(`Microphone recognition issue (${event.error}). Please try again.`);
      }
    };

    recognition.onend = () => {
      if (simulatedVolumeInterval) {
        clearInterval(simulatedVolumeInterval);
        simulatedVolumeInterval = null;
      }
      callbacks.onVolumeChange?.(0);
      callbacks.onEnd();
      activeRecognition = null;
    };

    activeRecognition = recognition;
    recognition.start();

    return () => {
      stopSpeechRecognition();
    };
  } catch (err: any) {
    console.warn('SpeechRecognition init error, falling back to MediaRecorder:', err);
    if (isMediaRecorderSupported()) {
      return startMediaRecorderFallback(callbacks, lang);
    }
    callbacks.onError(err.message || 'Failed to start microphone');
    return () => {};
  }
}

/**
 * Fallback voice recorder using browser MediaRecorder and Gemini audio transcription
 */
function startMediaRecorderFallback(
  callbacks: RecognitionCallbacks,
  lang = 'en-US'
): () => void {
  stopSpeechRecognition();

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    callbacks.onError('Microphone recording is unavailable in this environment.');
    return () => {};
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      activeMediaStream = stream;
      callbacks.onStart();

      // Setup audio analyzer for realistic volume meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!audioContext || audioContext.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          callbacks.onVolumeChange?.(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (audioErr) {
        console.warn('Volume meter error:', audioErr);
      }

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      recordedAudioChunks = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      activeMediaRecorder = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedAudioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopVolumeMonitoring();
        callbacks.onEnd();

        if (recordedAudioChunks.length === 0) return;

        const audioBlob = new Blob(recordedAudioChunks, { type: mimeType });
        recordedAudioChunks = [];

        try {
          callbacks.onResult('Transcribing speech...', false);
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (!base64Data) return;

            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Data, mimeType }),
              });
              if (!res.ok) throw new Error('Transcription request failed');
              const data = await res.json();
              if (data.text) {
                callbacks.onResult(data.text, true);
              } else {
                callbacks.onResult('', true);
              }
            } catch (err: any) {
              console.warn('Transcription error:', err);
              callbacks.onError('Could not transcribe audio. Please try speaking again.');
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: any) {
          console.warn('Blob processing error:', err);
        }
      };

      mediaRecorder.start(250);
    })
    .catch((err) => {
      console.warn('getUserMedia error:', err);
      callbacks.onError(
        'Microphone permission denied or unavailable. Please enable microphone permissions in your browser.'
      );
      callbacks.onEnd();
    });

  return () => {
    stopSpeechRecognition();
  };
}

export function stopSpeechRecognition(): void {
  if (simulatedVolumeInterval) {
    clearInterval(simulatedVolumeInterval);
    simulatedVolumeInterval = null;
  }

  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {}
    activeRecognition = null;
  }

  if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
    try {
      activeMediaRecorder.stop();
    } catch {}
    activeMediaRecorder = null;
  }

  stopVolumeMonitoring();
}

function stopVolumeMonitoring() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach((track) => track.stop());
    activeMediaStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch {}
    audioContext = null;
  }
}
