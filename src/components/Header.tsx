import React from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Trash2,
  Radio,
  Sun,
  Moon,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { VoiceState, ThemeMode } from '../types';

interface HeaderProps {
  voiceState: VoiceState;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onOpenSettings: () => void;
  onOpenLiveTalk: () => void;
  onOpenVoicePicker: () => void;
  onClearHistory: () => void;
  messageCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  voiceState,
  autoSpeak,
  onToggleAutoSpeak,
  onOpenSettings,
  onOpenLiveTalk,
  onOpenVoicePicker,
  onClearHistory,
  messageCount,
  theme,
  onToggleTheme,
}) => {
  const getStatusLabel = () => {
    switch (voiceState) {
      case 'listening':
        return 'Listening...';
      case 'speaking':
        return 'Speaking...';
      case 'thinking':
        return 'Quantum Neural Sync...';
      case 'ready':
      default:
        return 'Live • Gemini 2.5';
    }
  };

  const getStatusClass = () => {
    switch (voiceState) {
      case 'listening':
        return 'text-rose-500 border-rose-400/40 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
      case 'speaking':
        return 'text-indigo-600 border-indigo-400/40 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]';
      case 'thinking':
        return 'text-amber-600 border-amber-400/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'ready':
      default:
        return 'text-emerald-600 border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
    }
  };

  const getDotClass = () => {
    switch (voiceState) {
      case 'listening':
        return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-ping';
      case 'speaking':
        return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse';
      case 'thinking':
        return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-spin';
      case 'ready':
      default:
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
    }
  };

  return (
    <header
      id="enia-header"
      className="h-[76px] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-2xl relative z-20 transition-colors duration-300"
    >
      {/* Brand Identity & Futuristic Badge */}
      <div className="flex items-center gap-3.5">
        {/* Animated Rotating Conic Rainbow Logo */}
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-2xl rainbow-halo animate-spin-conic opacity-90 blur-[2px] transition duration-500" />
          <div
            id="enia-logo"
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl text-white tracking-tight bg-gradient-to-br from-[#6366f1] via-[#06b6d4] to-[#ec4899] shadow-lg transition-transform hover:scale-105"
          >
            E
          </div>
        </div>

        <div className="brand-text">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-black tracking-tight text-[var(--text-main)] flex items-center gap-1.5">
              ENIA
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-pink-500/15 text-indigo-600 border border-indigo-500/30">
                PRO 3.8
              </span>
            </h1>

            {/* Creator Badge (نعمان - Noman) */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-700 font-semibold text-[10px] tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>BY NOMAN (نعمان)</span>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-[11px] font-medium tracking-wide mt-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-500" />
            <span>Futuristic Neural & Real-Time Voice Intelligence</span>
          </p>
        </div>
      </div>

      {/* Header Actions & Futuristic Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Talk Button with Animated Colorful Glowing Aura */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl rainbow-halo animate-spin-conic-fast opacity-75 blur-[3px]" />
          <button
            id="header-live-talk-btn"
            onClick={onOpenLiveTalk}
            title="Start Live Hands-Free Talk (Speak & Real-Time Alternating Voice)"
            className="relative px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="tracking-wide">LIVE TALK</span>
          </button>
        </div>

        {/* Voices Quick Button ("وائسز والا بٹن") */}
        <button
          id="header-voices-btn"
          onClick={onOpenVoicePicker}
          title="وائس منتخب کریں (ہلکی پیاری، بھاری، لڑکے کی وائس وغیرہ)"
          className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 font-extrabold text-xs shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>وائسز (Voices)</span>
        </button>

        {/* Status indicator */}
        <div
          id="status-badge"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all duration-300 ${getStatusClass()}`}
        >
          <span className={`w-2 h-2 rounded-full ${getDotClass()}`} />
          <span className="tracking-wide hidden md:inline">{getStatusLabel()}</span>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Switch to Dark Cyber Theme' : 'Switch to Luminous Light Theme'}
          className="p-2.5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-card)] text-[var(--text-main)] hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center group"
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Auto-speech toggle */}
        <button
          id="toggle-speech-btn"
          onClick={onToggleAutoSpeak}
          title={autoSpeak ? 'Auto-voice read aloud is ON' : 'Auto-voice read aloud is OFF'}
          className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
            autoSpeak
              ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold'
              : 'border-[var(--panel-border)] bg-[var(--panel-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden lg:inline text-[11px]">
            {autoSpeak ? 'Voice ON' : 'Muted'}
          </span>
        </button>

        {/* Clear chat button */}
        {messageCount > 0 && (
          <button
            id="clear-chat-btn"
            onClick={onClearHistory}
            title="Reset conversation"
            className="p-2.5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-card)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-400/30 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Voice & Assistant Settings */}
        <button
          id="settings-btn"
          onClick={onOpenSettings}
          title="Voice & Assistant Configuration"
          className="p-2.5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-card)] text-[var(--text-main)] hover:border-indigo-400 hover:shadow-md transition-all flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4 text-indigo-500" />
          <span className="hidden xl:inline text-[11px] font-semibold">Settings</span>
        </button>
      </div>
    </header>
  );
};
