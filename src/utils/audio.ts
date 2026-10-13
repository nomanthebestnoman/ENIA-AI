// Audio playback helper for Gemini TTS (24kHz PCM / base64) and Browser Speech Synthesis

let audioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechWatchdogTimer: any = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioCtx({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Play raw PCM 16-bit little-endian audio returned by Gemini TTS
 */
export async function playPcmBase64(
  base64Audio: string,
  sampleRate = 24000,
  onEnded?: () => void,
  playbackRate = 1.0
): Promise<() => void> {
  stopAllAudio();

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {});
  }

  try {
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    // Each 16-bit PCM sample requires exactly 2 bytes (little-endian)
    const sampleCount = Math.floor(len / 2);
    if (sampleCount === 0) {
      onEnded?.();
      return () => {};
    }

    const float32 = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const b1 = binaryString.charCodeAt(i * 2);
      const b2 = binaryString.charCodeAt(i * 2 + 1);
      let int16Sample = b1 | (b2 << 8);
      if (int16Sample >= 0x8000) {
        int16Sample -= 0x10000;
      }
      float32[i] = int16Sample / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    if (playbackRate && playbackRate !== 1.0) {
      source.playbackRate.value = playbackRate;
    }
    source.connect(ctx.destination);

    currentSourceNode = source;

    source.onended = () => {
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
      onEnded?.();
    };

    source.start(0);

    return () => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore already stopped
      }
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
    };
  } catch (err) {
    console.warn('PCM playback error, completing playback gracefully:', err);
    onEnded?.();
    return () => {};
  }
}

/**
 * Stop any current audio or speech
 */
export function stopAllAudio(): void {
  if (speechWatchdogTimer) {
    clearTimeout(speechWatchdogTimer);
    speechWatchdogTimer = null;
  }

  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore
    }
    currentSourceNode = null;
  }

  activeUtterance = null;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Play text using browser SpeechSynthesis API
 */
export function speakWithBrowserSynthesis(
  text: string,
  config: {
    voiceURI?: string;
    rate?: number;
    pitch?: number;
    lang?: string;
  },
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  stopAllAudio();

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Browser SpeechSynthesis is not supported'));
    return () => {};
  }

  // Strip markdown formatting symbols for cleaner reading
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code snippet omitted for speech.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_~#>]/g, '')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return () => {};
  }

  // Resume synthesis engine in case the browser suspended it
  window.speechSynthesis.resume();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  activeUtterance = utterance;

  utterance.rate = config.rate || 1.0;
  utterance.pitch = config.pitch || 1.0;
  utterance.lang = config.lang || 'en-US';

  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = config.voiceURI
    ? voices.find((v) => v.voiceURI === config.voiceURI)
    : null;

  if (!selectedVoice && config.lang) {
    const langPrefix = config.lang.slice(0, 2).toLowerCase();
    selectedVoice =
      voices.find((v) => v.lang.toLowerCase() === config.lang?.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (speechWatchdogTimer) {
      clearTimeout(speechWatchdogTimer);
      speechWatchdogTimer = null;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    onEnd?.();
  };

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    finish();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      onError?.(e);
    }
    finish();
  };

  // Watchdog timer so state never gets stuck in case browser drops event
  const words = cleanText.split(/\s+/).length;
  const estimatedDurationMs = Math.max(3000, (words / 2.5) * 1000 + 4000);
  speechWatchdogTimer = setTimeout(() => {
    finish();
  }, estimatedDurationMs);

  window.speechSynthesis.speak(utterance);

  return () => {
    finish();
    window.speechSynthesis.cancel();
  };
}
