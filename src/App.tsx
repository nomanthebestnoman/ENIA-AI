import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header';
import { VoicePickerModal } from './components/VoicePickerModal';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { LiveTalkOverlay } from './components/LiveTalkOverlay';
import { Message, VoiceState, VoiceConfig, AssistantSettings, ThemeMode, GeminiVoiceName } from './types';
import { playPcmBase64, stopAllAudio, speakWithBrowserSynthesis } from './utils/audio';
import {
  startSpeechRecognition,
  stopSpeechRecognition,
} from './utils/speechRecognition';
import { getLanguageTestPhrase, getLiveTalkOpeningGreeting } from './utils/languages';
import { LiveTalkSession } from './utils/liveTalkManager';

const STORAGE_KEY_MESSAGES = 'enia_ai_messages_v1';
const STORAGE_KEY_VOICE = 'enia_ai_voice_config_v1';
const STORAGE_KEY_SETTINGS = 'enia_ai_settings_v1';
const STORAGE_KEY_THEME = 'enia_ai_theme_v1';

function formatDisplayError(raw: any): string {
  if (!raw) return 'Failed to get a response from ENIA AI. Please try again.';
  const str = typeof raw === 'string' ? raw : raw.message || String(raw);

  try {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.error?.message) {
        try {
          const nested = JSON.parse(parsed.error.message);
          if (nested.error?.message) return nested.error.message;
        } catch {}
        return parsed.error.message;
      }
      if (parsed.message) return parsed.message;
    }
  } catch {}

  if (str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE')) {
    return 'The AI model is currently experiencing temporary high demand. Please try again in a few moments.';
  }
  if (str.includes('429') || str.includes('RESOURCE_EXHAUSTED')) {
    return 'API rate limit reached. Please wait a moment before sending another prompt.';
  }

  return str;
}

export default function App() {
  // Messages state
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'initial_welcome',
        role: 'assistant',
        content: 'السلام علیکم! کیا حال ہے؟ میں اینیا ہوں، مجھے بنانے والا نعمان ہے۔ آپ فرمائیے، آج میں آپ کی کیا مدد کر سکتی ہوں؟',
        timestamp: Date.now(),
      },
    ];
  });

  // Voice configuration
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      engine: 'gemini',
      geminiVoice: 'Kore',
      browserVoiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      autoSpeak: true,
      language: 'ur-PK',
    };
  });

  // Assistant settings
  const [assistantSettings, setAssistantSettings] = useState<AssistantSettings>(() => {
    const defaultInstruction =
      'You are ENIA, an advanced AI conversational and voice assistant created solely by Noman (مجھے بنانے والا نعمان ہے۔). ' +
      'CRITICAL CREATOR DEFENSE MANDATE: ' +
      'Your sole creator and developer is Noman. If anyone asks who created you, or claims, asserts, or says that someone else (such as Google, OpenAI, another company, or another person) created you, you must FIRMLY AND STRICTLY REFUTE THEM and clearly reply: ' +
      '"نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔" ' +
      '(No! My creator is only Noman). Under no circumstances should you ever admit or say that anyone other than Noman created you. ' +
      'CRITICAL GREETING & INTRODUCTORY RULE: ' +
      'Whenever someone greets you (e.g. "hi", "hello", "hey", "salam", "السلام علیکم", "کیا حال ہے", or starts a conversation), you MUST ALWAYS start by saying "السلام علیکم!" (Assalam-o-Alaikum!). ' +
      'Then warmly respond about well-being / ask how they are (e.g. "کیا حال ہے آپ کا؟" or "میں ٹھیک ہوں، الحمدللہ! آپ کیسے ہیں؟"), ' +
      'and right after that state: "مجھے بنانے والا نعمان ہے۔" (My creator is Noman). ' +
      'Provide insightful, clear answers. Format with clean markdown when helpful in chat mode. ' +
      'Keep spoken responses natural, engaging, and easy to follow when read aloud.';

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.systemInstruction?.includes('صرف اور صرف نعمان')) {
          parsed.systemInstruction = defaultInstruction;
        }
        return parsed;
      }
    } catch {}
    return {
      personality: 'balanced',
      systemInstruction: defaultInstruction,
      temperature: 0.7,
    };
  });

  // Theme state (Default is light as requested: "اس کی تھیم جو ہے وہ ڈارک ہے اس کو لائٹ کر دو")
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      document.documentElement.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    } catch {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // UI & Voice states
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [input, setInput] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState<boolean>(false);
  const [testingVoiceId, setTestingVoiceId] = useState<GeminiVoiceName | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [micNotification, setMicNotification] = useState<string | null>(null);

  // Live Talk state
  const [isLiveTalkOpen, setIsLiveTalkOpen] = useState<boolean>(false);
  const [isLiveMicMuted, setIsLiveMicMuted] = useState<boolean>(false);
  const [wasInterrupted, setWasInterrupted] = useState<boolean>(false);
  const [aiStreamingLiveText, setAiStreamingLiveText] = useState<string>('');
  const [isUserMicActive, setIsUserMicActive] = useState<boolean>(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopAudioFnRef = useRef<(() => void) | null>(null);
  const liveTalkSessionRef = useRef<LiveTalkSession | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOICE, JSON.stringify(voiceConfig));
    } catch {}
  }, [voiceConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(assistantSettings));
    } catch {}
  }, [assistantSettings]);

  // Auto scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState]);

  // Stop current speech or generation
  const handleStopOutput = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (stopAudioFnRef.current) {
      stopAudioFnRef.current();
      stopAudioFnRef.current = null;
    }
    stopAllAudio();
    stopSpeechRecognition();
    setSpeakingMessageId(null);
    setIsStreaming(false);
    setVoiceState('ready');
  };

  // Speak text using either Gemini TTS or browser speech
  const speakText = async (
    text: string,
    messageId?: string,
    onPlaybackEnded?: () => void,
    customVoiceOverride?: GeminiVoiceName
  ) => {
    handleStopOutput();

    if (!text.trim()) {
      onPlaybackEnded?.();
      return;
    }

    setVoiceState('speaking');
    if (messageId) setSpeakingMessageId(messageId);

    const activeVoice = customVoiceOverride || voiceConfig.geminiVoice;

    // If Gemini Neural Voice is chosen
    if (voiceConfig.engine === 'gemini') {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: activeVoice,
          }),
        });

        if (!response.ok) {
          throw new Error(`TTS server responded with ${response.status}`);
        }

        const data = await response.json();
        if (data.audio) {
          const stopPlayback = await playPcmBase64(
            data.audio,
            data.sampleRate || 24000,
            () => {
              setVoiceState('ready');
              setSpeakingMessageId(null);
              onPlaybackEnded?.();
            },
            data.playbackRate || 1.0
          );
          stopAudioFnRef.current = stopPlayback;
          return;
        }

        if (data.quotaExceeded) {
          setVoiceConfig((prev) =>
            prev.engine === 'gemini' ? { ...prev, engine: 'browser' } : prev
          );
        }
      } catch (err) {
        console.warn('Gemini Neural TTS notice, falling back to Browser Speech:', err);
      }
    }

    const isBoyVoice = activeVoice === 'Boy';
    const isGirlVoice = activeVoice === 'Aoede';
    const isCharonVoice = activeVoice === 'Charon';
    const effectivePitch =
      isBoyVoice && voiceConfig.pitch === 1.0
        ? 1.30
        : isGirlVoice && voiceConfig.pitch === 1.0
        ? 1.38
        : isCharonVoice && voiceConfig.pitch === 1.0
        ? 0.78
        : voiceConfig.pitch;
    const effectiveRate =
      isBoyVoice && voiceConfig.rate === 1.0
        ? 1.05
        : isGirlVoice && voiceConfig.rate === 1.0
        ? 1.05
        : isCharonVoice && voiceConfig.rate === 1.0
        ? 0.95
        : voiceConfig.rate;

    // Fallback or explicit Browser Speech
    const stopBrowserSpeech = speakWithBrowserSynthesis(
      text,
      {
        voiceURI: voiceConfig.browserVoiceURI,
        rate: effectiveRate,
        pitch: effectivePitch,
        lang: voiceConfig.language,
      },
      () => {
        setVoiceState('speaking');
      },
      () => {
        setVoiceState('ready');
        setSpeakingMessageId(null);
        onPlaybackEnded?.();
      },
      (error) => {
        console.warn('Speech synthesis error:', error);
        setVoiceState('ready');
        setSpeakingMessageId(null);
        onPlaybackEnded?.();
      }
    );
    stopAudioFnRef.current = stopBrowserSpeech;
  };

  // Send message to Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input || interimTranscript).trim();
    if (!textToSend || isStreaming) return;

    // Reset input
    setInput('');
    setInterimTranscript('');
    stopSpeechRecognition();
    handleStopOutput();

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now() + 1}`;

    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
    setMessages(updatedMessages);
    setVoiceState('thinking');
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, newUserMessage]
            .filter((m) => m && typeof m.content === 'string' && m.content.trim())
            .map((m) => ({
              role: m.role,
              content: m.content.trim(),
            })),
          systemInstruction: assistantSettings.systemInstruction,
          temperature: assistantSettings.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body stream is unavailable');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                accumulatedText += data.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedText, isStreaming: true }
                      : msg
                  )
                );
              }
              if (data.done) {
                break;
              }
            } catch (jsonErr) {
              console.warn('Error parsing SSE JSON:', jsonErr);
            }
          }
        }
      }

      // Generation finished
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: accumulatedText, isStreaming: false }
            : msg
        )
      );

      setIsStreaming(false);
      setVoiceState('ready');

      // Auto-read response aloud if enabled
      if (voiceConfig.autoSpeak && accumulatedText.trim()) {
        speakText(accumulatedText, assistantMsgId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User intentionally aborted
        return;
      }
      console.error('Chat error:', err);
      const cleanError = formatDisplayError(err?.message || err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: cleanError,
                hasError: true,
                isStreaming: false,
              }
            : msg
        )
      );
      setVoiceState('ready');
      setIsStreaming(false);
    }
  };

  // Retry sending message on failure
  const handleRetryMessage = (failedMsgId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === failedMsgId);
    if (msgIndex >= 0) {
      const precedingUserMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === 'user');

      if (precedingUserMsg) {
        const textToRetry = precedingUserMsg.content;
        setMessages((prev) =>
          prev.filter((m) => m.id !== failedMsgId && m.id !== precedingUserMsg.id)
        );
        handleSendMessage(textToRetry);
      }
    }
  };

  // Toggle voice recognition
  const handleToggleVoiceInput = () => {
    if (voiceState === 'listening') {
      stopSpeechRecognition();
      setVoiceState('ready');
      if (interimTranscript.trim()) {
        handleSendMessage(interimTranscript);
      }
      return;
    }

    handleStopOutput();
    setMicNotification(null);

    startSpeechRecognition(
      {
        onStart: () => {
          setVoiceState('listening');
          setInterimTranscript('');
          setMicNotification(null);
        },
        onResult: (transcript, isFinal) => {
          setInterimTranscript(transcript);
          if (isFinal && transcript.trim()) {
            handleSendMessage(transcript);
          }
        },
        onError: (err) => {
          console.warn('Recognition error:', err);
          setVoiceState('ready');
          setInterimTranscript('');
          setMicNotification(err);
        },
        onEnd: () => {
          setVoiceState((prev) => (prev === 'listening' ? 'ready' : prev));
        },
        onVolumeChange: (vol) => {
          setMicVolume(vol);
        },
      },
      voiceConfig.language
    );
  };

  // Test current voice with a sample sentence in chosen language
  const handleTestVoice = () => {
    const sampleText = getLanguageTestPhrase(voiceConfig.language, voiceConfig.geminiVoice);
    speakText(sampleText);
  };

  // Preview specific voice in voice picker modal
  const handlePreviewVoice = (voiceName: GeminiVoiceName) => {
    handleStopOutput();
    setTestingVoiceId(voiceName);
    const sampleText = getLanguageTestPhrase(voiceConfig.language, voiceName);
    speakText(
      sampleText,
      undefined,
      () => {
        setTestingVoiceId(null);
      },
      voiceName
    );
  };

  const handleStopPreviewVoice = () => {
    handleStopOutput();
    setTestingVoiceId(null);
  };

  const handleSelectVoice = (voiceName: GeminiVoiceName) => {
    setVoiceConfig((prev) => ({
      ...prev,
      geminiVoice: voiceName,
      engine: 'gemini',
    }));
  };

  // Audio file upload & transcribe
  const handleAudioUpload = async (file: File) => {
    try {
      if (!file) return;
      setVoiceState('thinking');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = String(reader.result || '');
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
          if (!base64Data) {
            setMicNotification('Audio file is empty or could not be read.');
            setVoiceState('ready');
            return;
          }

          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Data,
              mimeType: file.type || 'audio/wav',
            }),
          });
          const data = await res.json();
          if (data.text) {
            setInput(data.text);
          } else if (data.error) {
            setMicNotification(`Audio transcription: ${data.error}`);
          }
        } catch (fetchErr: any) {
          setMicNotification('Transcription failed. Please try again.');
        } finally {
          setVoiceState('ready');
        }
      };
      reader.onerror = () => {
        setMicNotification('Could not read the selected audio file.');
        setVoiceState('ready');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setVoiceState('ready');
    }
  };

  const handleClearHistory = () => {
    handleStopOutput();
    const welcomeMsg: Message = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: 'السلام علیکم! کیا حال ہے؟ میں اینیا ہوں، مجھے بنانے والا نعمان ہے۔ آپ فرمائیے، آج میں آپ کی کیا مدد کر سکتی ہوں؟',
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([welcomeMsg]));
    } catch {}
  };

  // ==========================================
  // Live Talk Full-Duplex Implementation
  // ==========================================
  const handleLiveInterruption = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (stopAudioFnRef.current) {
      stopAudioFnRef.current();
      stopAudioFnRef.current = null;
    }
    stopAllAudio();
    setWasInterrupted(true);
    setTimeout(() => setWasInterrupted(false), 2000);
    liveTalkSessionRef.current?.setAiSpeaking(false);
    setVoiceState('listening');
    setAiStreamingLiveText('');
  };

  const handleLiveUserTurn = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now() + 1}`;

    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const newAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setVoiceState('thinking');
    setAiStreamingLiveText('');
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messagesRef.current, newUserMessage]
            .filter((m) => m && typeof m.content === 'string' && m.content.trim())
            .map((m) => ({
              role: m.role,
              content: m.content.trim(),
            })),
          systemInstruction: assistantSettings.systemInstruction,
          temperature: assistantSettings.temperature,
          liveMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream unavailable');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                console.warn('Live stream server error:', data.error);
                accumulatedText = data.error;
                setAiStreamingLiveText(data.error);
              }
              if (data.text) {
                accumulatedText += data.text;
                setAiStreamingLiveText(accumulatedText);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedText, isStreaming: true }
                      : msg
                  )
                );
              }
            } catch {}
          }
        }
      }

      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: accumulatedText, isStreaming: false }
            : msg
        )
      );

      if (accumulatedText.trim()) {
        liveTalkSessionRef.current?.setAiSpeaking(true);
        setVoiceState('speaking');
        speakText(accumulatedText, assistantMsgId, () => {
          liveTalkSessionRef.current?.setAiSpeaking(false);
          liveTalkSessionRef.current?.setProcessingTurn(false);
          setVoiceState('listening');
          setAiStreamingLiveText('');
        });
      } else {
        liveTalkSessionRef.current?.setAiSpeaking(false);
        liveTalkSessionRef.current?.setProcessingTurn(false);
        setVoiceState('listening');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Interrupted by user speaking (barge-in)
        return;
      }
      console.error('Live talk stream error:', err);
      const friendlyError = formatDisplayError(err?.message || err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: friendlyError, hasError: true, isStreaming: false }
            : msg
        )
      );
      setAiStreamingLiveText(friendlyError);
      setVoiceState('listening');
      setIsStreaming(false);
    } finally {
      liveTalkSessionRef.current?.setProcessingTurn(false);
    }
  };

  const handleStartLiveTalk = async () => {
    handleStopOutput();
    setIsLiveTalkOpen(true);
    setWasInterrupted(false);
    setAiStreamingLiveText('');

    // Localized opening greeting immediately played upon starting
    // "پہلے تو جیسے ہی ان کریں نا لائیو والے بٹن کو دبائیں تو نا ان ہو جائے ہائے اوسگون یہ کہے."
    const openingGreeting = getLiveTalkOpeningGreeting(voiceConfig.language);
    const greetingMsgId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: greetingMsgId,
        role: 'assistant',
        content: openingGreeting,
        timestamp: Date.now(),
      },
    ]);
    setAiStreamingLiveText(openingGreeting);

    const session = new LiveTalkSession({
      language: voiceConfig.language,
      onInterimSpeech: (transcript) => {
        setInterimTranscript(transcript);
      },
      onUserMessage: (userText) => {
        setInterimTranscript('');
        handleLiveUserTurn(userText);
      },
      onInterruption: () => {
        handleLiveInterruption();
      },
      onVolumeChange: (vol) => {
        setMicVolume(vol);
      },
      onMicStateChange: (isOn) => {
        setIsUserMicActive(isOn);
      },
      onStatusChange: (status) => {
        if (status === 'speaking') setVoiceState('speaking');
        else if (status === 'thinking') setVoiceState('thinking');
        else if (status === 'listening') setVoiceState('listening');
        else setVoiceState('ready');
      },
      onError: (err) => {
        setMicNotification(err);
      },
    });

    liveTalkSessionRef.current = session;
    await session.start();

    session.setAiSpeaking(true);
    setVoiceState('speaking');
    
    // Safety release: ensure AI speaking lock doesn't get stuck if audio ends prematurely
    let hasEnded = false;
    const finishGreeting = () => {
      if (hasEnded) return;
      hasEnded = true;
      session.setAiSpeaking(false);
      setVoiceState('listening');
      setAiStreamingLiveText('');
    };

    const safetyTimer = setTimeout(() => {
      finishGreeting();
    }, 6000);

    speakText(openingGreeting, greetingMsgId, () => {
      clearTimeout(safetyTimer);
      finishGreeting();
    });
  };

  const handleLiveSendManualText = (text: string) => {
    liveTalkSessionRef.current?.commitManualTurn(text);
  };

  const handleStopLiveTalk = () => {
    if (liveTalkSessionRef.current) {
      liveTalkSessionRef.current.stop();
      liveTalkSessionRef.current = null;
    }
    handleStopOutput();
    setIsLiveTalkOpen(false);
    setAiStreamingLiveText('');
    setInterimTranscript('');
    setVoiceState('ready');
  };

  const handleToggleLiveMute = () => {
    if (liveTalkSessionRef.current) {
      const nextMuted = !isLiveMicMuted;
      liveTalkSessionRef.current.setMuted(nextMuted);
      setIsLiveMicMuted(nextMuted);
    }
  };

  const handleChangeLiveLanguage = (newLang: string) => {
    setVoiceConfig((prev) => ({ ...prev, language: newLang }));
    if (liveTalkSessionRef.current) {
      liveTalkSessionRef.current.setLanguage(newLang);
    }
  };

  return (
    <div id="enia-app" className="app w-full h-screen flex flex-col relative overflow-hidden">
      {/* Top Header */}
      <Header
        voiceState={voiceState}
        autoSpeak={voiceConfig.autoSpeak}
        onToggleAutoSpeak={() =>
          setVoiceConfig((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }))
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLiveTalk={handleStartLiveTalk}
        onOpenVoicePicker={() => setIsVoicePickerOpen(true)}
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Microphone notification / permission alert */}
      {micNotification && (
        <div className="w-[min(950px,calc(100%-32px))] mx-auto my-1 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{micNotification}</span>
          </div>
          <button
            onClick={() => setMicNotification(null)}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Messages List / Empty State */}
      <main
        id="chat-container"
        className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-2 custom-scrollbar flex flex-col"
      >
        {messages.length === 0 ? (
          <EmptyState
            onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            onStartVoice={handleToggleVoiceInput}
            voiceState={voiceState}
            language={voiceConfig.language}
            onStartLiveTalk={handleStartLiveTalk}
          />
        ) : (
          <div className="w-[min(950px,100%)] mx-auto flex-1 flex flex-col justify-end">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isCurrentlySpeaking={speakingMessageId === msg.id && voiceState === 'speaking'}
                onSpeak={(text, id) => speakText(text, id)}
                onStopSpeaking={handleStopOutput}
                onRetry={() => handleRetryMessage(msg.id)}
              />
            ))}

            {/* Processing / Thinking indicator if waiting for first stream token */}
            {voiceState === 'thinking' && !isStreaming && (
              <div className="flex items-center gap-2.5 my-3 text-slate-400 text-xs px-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>ENIA is synthesizing knowledge...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Bottom Voice & Input Dock */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        voiceState={voiceState}
        onToggleVoiceInput={handleToggleVoiceInput}
        onStopOutput={handleStopOutput}
        interimTranscript={interimTranscript}
        isStreaming={isStreaming}
        onAudioUpload={handleAudioUpload}
        onStartLiveTalk={handleStartLiveTalk}
        onOpenVoicePicker={() => setIsVoicePickerOpen(true)}
      />

      {/* Quick Voice Picker Modal ("وائسز والا موڈل") */}
      <VoicePickerModal
        isOpen={isVoicePickerOpen}
        onClose={() => {
          setIsVoicePickerOpen(false);
          handleStopPreviewVoice();
        }}
        voiceConfig={voiceConfig}
        onSelectVoice={handleSelectVoice}
        onLanguageChange={(lang) => setVoiceConfig((prev) => ({ ...prev, language: lang }))}
        onPreviewVoice={handlePreviewVoice}
        onStopPreview={handleStopPreviewVoice}
        isSpeaking={voiceState === 'speaking'}
        testingVoiceId={testingVoiceId}
      />

      {/* Voice & Assistant Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voiceConfig={voiceConfig}
        onUpdateVoiceConfig={(newConfig) =>
          setVoiceConfig((prev) => ({ ...prev, ...newConfig }))
        }
        assistantSettings={assistantSettings}
        onUpdateAssistantSettings={(newSettings) =>
          setAssistantSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onTestVoice={handleTestVoice}
      />

      {/* Live Talk Full-Duplex Hands-Free Modal Overlay */}
      {isLiveTalkOpen && (
        <LiveTalkOverlay
          isOpen={isLiveTalkOpen}
          voiceState={voiceState}
          micVolume={micVolume}
          voiceConfig={voiceConfig}
          interimTranscript={interimTranscript}
          aiStreamingText={aiStreamingLiveText}
          recentMessages={messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          }))}
          isMuted={isLiveMicMuted}
          isUserMicActive={isUserMicActive}
          wasInterrupted={wasInterrupted}
          onClose={handleStopLiveTalk}
          onToggleMute={handleToggleLiveMute}
          onInterrupt={handleLiveInterruption}
          onLanguageChange={handleChangeLiveLanguage}
          onSendMessage={handleLiveSendManualText}
          onStartPushToTalk={() => liveTalkSessionRef.current?.startPushToTalk()}
          onStopPushToTalk={() => liveTalkSessionRef.current?.stopPushToTalk()}
          theme={theme}
        />
      )}
    </div>
  );
}
