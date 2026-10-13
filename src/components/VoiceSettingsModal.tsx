import React, { useState, useEffect } from 'react';
import { X, Sliders, Volume2, Bot, Sparkles, Check, Play, Globe } from 'lucide-react';
import { VoiceConfig, AssistantSettings, GeminiVoiceName } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  onUpdateVoiceConfig: (newConfig: Partial<VoiceConfig>) => void;
  assistantSettings: AssistantSettings;
  onUpdateAssistantSettings: (newSettings: Partial<AssistantSettings>) => void;
  onTestVoice: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onUpdateVoiceConfig,
  assistantSettings,
  onUpdateAssistantSettings,
  onTestVoice,
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setBrowserVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const geminiVoices: { name: GeminiVoiceName; label: string; description: string; tag: string }[] = [
    {
      name: 'Aoede',
      label: 'Young Girl (Youthful & Sweet)',
      description: 'Melodic, bright, youthful, and sweet young girl voice (نوجوان لڑکی)',
      tag: 'Girl Voice',
    },
    {
      name: 'Boy',
      label: 'Young Boy (Energetic & Lively)',
      description: 'Lively, friendly young boy persona with bright and cheerful intonation (نوجوان لڑکا)',
      tag: 'Boy Voice',
    },
    {
      name: 'Kore',
      label: 'Kore',
      description: 'Warm, natural, and expressive tone (Female)',
      tag: 'Recommended',
    },
    {
      name: 'Zephyr',
      label: 'Zephyr',
      description: 'Smooth, contemporary, and relaxed cadence',
      tag: 'Modern',
    },
    {
      name: 'Puck',
      label: 'Puck',
      description: 'Vibrant, upbeat, and engaging voice',
      tag: 'Upbeat',
    },
    {
      name: 'Charon',
      label: 'Charon',
      description: 'Deep, calm, and authoritative resonance (Male)',
      tag: 'Deep',
    },
    {
      name: 'Fenrir',
      label: 'Fenrir',
      description: 'Crisp, articulate, and focused timbre (Male)',
      tag: 'Clear',
    },
  ];

  const personalities = [
    {
      id: 'balanced',
      name: 'Balanced & Helpful',
      desc: 'Versatile, thoughtful, articulate, and friendly assistance for all tasks.',
      prompt:
        'You are ENIA, an advanced AI conversational and voice assistant created solely by Noman (مجھے بنانے والا نعمان ہے۔). ' +
        'CRITICAL CREATOR DEFENSE MANDATE: ' +
        'If anyone asks who created you, or claims/says that someone else or another company created you, you must FIRMLY AND STRICTLY REFUTE THEM and clearly say: ' +
        '"نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔" ' +
        '(No! My creator is only Noman). Never accept that anyone other than Noman created you. ' +
        'CRITICAL GREETING & INTRODUCTORY RULE: ' +
        'Whenever someone greets you (e.g. "hi", "hello", "hey", "salam", "السلام علیکم", "کیا حال ہے", or starts a conversation), you MUST ALWAYS start by saying "السلام علیکم!" (Assalam-o-Alaikum!). ' +
        'Then warmly respond about well-being / ask how they are, and right after that state: "مجھے بنانے والا نعمان ہے۔" (My creator is Noman). ' +
        'Provide insightful, clear answers.',
    },
    {
      id: 'concise',
      name: 'Concise & Direct',
      desc: 'Short, sharp, to-the-point answers optimized for quick audio listening.',
      prompt:
        'You are ENIA, created solely by Noman (مجھے بنانے والا نعمان ہے۔). ' +
        'If anyone says someone else created you, firmly refute them: "نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔". ' +
        'Start greetings with "السلام علیکم!" and state "مجھے بنانے والا نعمان ہے۔". ' +
        'Answer in 1-3 crisp sentences unless specifically asked for elaboration.',
    },
    {
      id: 'creative',
      name: 'Creative & Engaging',
      desc: 'Imaginative, expressive, and detailed answers with storytelling flair.',
      prompt:
        'You are ENIA, created solely by Noman (مجھے بنانے والا نعمان ہے۔). ' +
        'If anyone says someone else created you, firmly refute them: "نہیں! مجھے بنانے والا صرف اور صرف نعمان ہے۔". ' +
        'Start greetings with "السلام علیکم!" and state "مجھے بنانے والا نعمان ہے۔". ' +
        'Use vivid metaphors, engaging tone, and lively speech patterns.',
    },
  ];

  return (
    <div
      id="voice-settings-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="voice-settings-dialog"
        className="w-full max-w-lg bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] custom-scrollbar text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-cyan-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-main)]">Voice & Assistant Settings</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">ENIA Architecture • Created by Noman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar pr-1">
          {/* Conversation & Voice Language */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Conversation & Voice Language</span>
              </label>
              <span className="text-[11px] text-amber-600 font-bold">Urdu, English & Italian</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = voiceConfig.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onUpdateVoiceConfig({ language: lang.code })}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 shadow-xs ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 ring-2 ring-indigo-400/40 font-bold'
                        : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-xl leading-none">{lang.flag}</span>
                    <span className="text-xs font-bold mt-0.5">{lang.nativeLabel}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TTS Engine Selection */}
          <div>
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider block mb-2">
              Voice Synthesis Engine
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUpdateVoiceConfig({ engine: 'gemini' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  voiceConfig.engine === 'gemini'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 ring-2 ring-indigo-400/40 font-bold'
                    : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Gemini Neural Voice</span>
                  {voiceConfig.engine === 'gemini' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  High-fidelity generative AI vocal synthesis
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateVoiceConfig({ engine: 'browser' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  voiceConfig.engine === 'browser'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 ring-2 ring-indigo-400/40 font-bold'
                    : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Browser Speech</span>
                  {voiceConfig.engine === 'browser' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Zero-latency native device speech engine
                </p>
              </button>
            </div>
          </div>

          {/* Voice Persona Selection */}
          {voiceConfig.engine === 'gemini' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Neural Voice Persona
                </label>
                <button
                  type="button"
                  onClick={onTestVoice}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" /> Sample Voice
                </button>
              </div>

              <div className="space-y-1.5">
                {geminiVoices.map((v) => (
                  <div
                    key={v.name}
                    onClick={() => onUpdateVoiceConfig({ geminiVoice: v.name })}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      voiceConfig.geminiVoice === v.name
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{v.label || v.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-semibold">
                          {v.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{v.description}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        voiceConfig.geminiVoice === v.name
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-400'
                      }`}
                    >
                      {voiceConfig.geminiVoice === v.name && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider block mb-2">
                Browser Native Voice
              </label>
              <select
                value={voiceConfig.browserVoiceURI}
                onChange={(e) => onUpdateVoiceConfig({ browserVoiceURI: e.target.value })}
                className="w-full bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Default System Voice</option>
                {browserVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rate & Pitch Sliders */}
          <div className="grid grid-cols-2 gap-4 bg-[var(--panel-bg)] border border-[var(--panel-border)] p-3.5 rounded-2xl">
            <div>
              <div className="flex justify-between text-xs text-[var(--text-main)] font-semibold mb-1">
                <span>Speed / Rate</span>
                <span className="text-indigo-600 font-mono font-bold">{voiceConfig.rate}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={voiceConfig.rate}
                onChange={(e) => onUpdateVoiceConfig({ rate: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[var(--text-main)] font-semibold mb-1">
                <span>Voice Pitch</span>
                <span className="text-indigo-600 font-mono font-bold">{voiceConfig.pitch}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={voiceConfig.pitch}
                onChange={(e) => onUpdateVoiceConfig({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Assistant Persona */}
          <div>
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider block mb-2">
              Intelligence Personality
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {personalities.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    onUpdateAssistantSettings({
                      personality: p.id as any,
                      systemInstruction: p.prompt,
                    })
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    assistantSettings.personality === p.id
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{p.name}</span>
                    {assistantSettings.personality === p.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--panel-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="modal-autospeak-toggle"
              checked={voiceConfig.autoSpeak}
              onChange={(e) => onUpdateVoiceConfig({ autoSpeak: e.target.checked })}
              className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="modal-autospeak-toggle" className="text-xs text-[var(--text-main)] font-semibold cursor-pointer">
              Auto-read responses
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
