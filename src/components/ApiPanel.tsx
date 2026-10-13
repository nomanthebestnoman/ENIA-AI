import React from 'react';
import { Zap, Sparkles, Play, Square, Globe, Radio } from 'lucide-react';
import { VoiceConfig, VoiceState } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface ApiPanelProps {
  voiceConfig: VoiceConfig;
  voiceState: VoiceState;
  micVolume: number;
  onVoiceChange: (voice: VoiceConfig['geminiVoice']) => void;
  onLanguageChange: (language: string) => void;
  onEngineChange: (engine: VoiceConfig['engine']) => void;
  onTestVoice: () => void;
  onStopVoice: () => void;
  onOpenLiveTalk?: () => void;
}

export const ApiPanel: React.FC<ApiPanelProps> = ({
  voiceConfig,
  voiceState,
  micVolume,
  onVoiceChange,
  onLanguageChange,
  onEngineChange,
  onTestVoice,
  onStopVoice,
  onOpenLiveTalk,
}) => {
  const geminiVoices: Array<{ value: VoiceConfig['geminiVoice']; label: string }> = [
    { value: 'Boy', label: 'Voice: Boy (Youthful)' },
    { value: 'Kore', label: 'Voice: Kore (Warm)' },
    { value: 'Zephyr', label: 'Voice: Zephyr (Smooth)' },
    { value: 'Puck', label: 'Voice: Puck (Upbeat)' },
    { value: 'Charon', label: 'Voice: Charon (Deep)' },
    { value: 'Fenrir', label: 'Voice: Fenrir (Crisp)' },
  ];

  const isSpeaking = voiceState === 'speaking';

  return (
    <section
      id="enia-api-panel"
      className="w-[min(950px,calc(100%-32px))] mx-auto mt-2.5 mb-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 p-2.5 bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-2xl backdrop-blur-xl shadow-sm relative z-10 transition-colors"
    >
      {/* Model & Speed status tag */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-600">
          <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Gemini 2.5 Flash</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-600">
          <Sparkles className="w-3 h-3 text-cyan-500" />
          <span>Multilingual HD</span>
        </div>
      </div>

      {/* Center Audio Visualizer */}
      <div className="flex-1 min-w-[120px] flex justify-center">
        <AudioVisualizer voiceState={voiceState} micVolume={micVolume} barCount={18} />
      </div>

      {/* Language, Voice & Engine controls */}
      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
        {/* Language selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 pointer-events-none" />
          <select
            id="app-language-selector"
            value={voiceConfig.language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Select Assistant Language"
            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] text-xs text-[var(--text-main)] font-semibold rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeLabel} ({lang.label})
              </option>
            ))}
          </select>
        </div>

        {/* Engine switcher */}
        <select
          id="tts-engine-selector"
          value={voiceConfig.engine}
          onChange={(e) => onEngineChange(e.target.value as any)}
          aria-label="Select voice synthesis engine"
          className="bg-[var(--panel-bg)] border border-[var(--panel-border)] text-xs text-[var(--text-secondary)] font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer hidden md:block shadow-xs"
        >
          <option value="gemini">Gemini Voice</option>
          <option value="browser">Browser Voice</option>
        </select>

        {/* Gemini Voice Picker */}
        {voiceConfig.engine === 'gemini' && (
          <select
            id="gemini-voice-selector"
            value={voiceConfig.geminiVoice}
            onChange={(e) => onVoiceChange(e.target.value as any)}
            aria-label="Select Gemini voice persona"
            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] text-xs text-indigo-600 font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            {geminiVoices.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        )}

        {/* Test Voice / Stop speaking button */}
        {isSpeaking ? (
          <button
            id="stop-speech-action-btn"
            onClick={onStopVoice}
            title="Stop speaking"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 text-xs font-semibold hover:bg-rose-500/25 transition-all shadow-xs"
          >
            <Square className="w-3 h-3 fill-rose-600" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            id="test-voice-btn"
            onClick={onTestVoice}
            title="Sample voice preview"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-main)] text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs"
          >
            <Play className="w-3 h-3 fill-current text-indigo-500" />
            <span className="hidden sm:inline">Test Voice</span>
          </button>
        )}

        {/* Quick Live Talk Launcher */}
        {onOpenLiveTalk && (
          <button
            id="panel-live-talk-btn"
            onClick={onOpenLiveTalk}
            title="Launch Full-Duplex Live Talk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <Radio className="w-3 h-3" />
            <span className="hidden lg:inline">Live Talk</span>
          </button>
        )}
      </div>
    </section>
  );
};
