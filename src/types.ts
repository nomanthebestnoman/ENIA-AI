export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  hasError?: boolean;
}

export type VoiceState = 'ready' | 'listening' | 'speaking' | 'thinking';

export type TTSEngine = 'browser' | 'gemini';

export type ThemeMode = 'light' | 'dark';

export type SupportedLanguage = 'en-US' | 'it-IT' | 'ur-PK';

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

export type GeminiVoiceName = 'Boy' | 'Aoede' | 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';

export interface VoiceConfig {
  engine: TTSEngine;
  geminiVoice: GeminiVoiceName;
  browserVoiceURI: string;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
  language: string;
}

export interface AssistantSettings {
  personality: 'balanced' | 'creative' | 'concise' | 'coder';
  systemInstruction: string;
  temperature: number;
}
