import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Send,
  Volume2,
  Minimize2,
  Maximize2,
  Zap,
  Sparkles,
  Cpu,
  Activity,
} from 'lucide-react';
import { VoiceConfig, VoiceState, ThemeMode } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface LiveTalkOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  voiceState: VoiceState;
  micVolume: number;
  interimTranscript: string;
  aiStreamingText: string;
  recentMessages: { role: 'user' | 'assistant'; content: string }[];
  voiceConfig: VoiceConfig;
  onLanguageChange: (lang: string) => void;
  onInterrupt: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  wasInterrupted: boolean;
  isUserMicActive?: boolean;
  onSendMessage?: (text: string) => void;
  onStartPushToTalk?: () => void;
  onStopPushToTalk?: () => void;
  theme?: ThemeMode;
}

export const LiveTalkOverlay: React.FC<LiveTalkOverlayProps> = ({
  isOpen,
  onClose,
  voiceState,
  micVolume,
  interimTranscript,
  aiStreamingText,
  recentMessages,
  voiceConfig,
  onLanguageChange,
  onInterrupt,
  onToggleMute,
  isMuted,
  wasInterrupted,
  isUserMicActive = false,
  onSendMessage,
  onStartPushToTalk,
  onStopPushToTalk,
  theme = 'light',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const dialogEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dialogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [recentMessages, aiStreamingText, interimTranscript]);

  if (!isOpen) return null;

  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';
  const isListening = voiceState === 'listening' || isUserMicActive;
  const isUrdu = voiceConfig.language === 'ur-PK';

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === voiceConfig.language) || SUPPORTED_LANGUAGES[0];

  const getStatusText = () => {
    if (wasInterrupted) {
      if (isUrdu) return 'روک دیا گیا • مائیک آن ہے، اب آپ فرمائیے...';
      if (voiceConfig.language === 'it-IT') return 'Interrotto • Microfono ON, ti ascolto...';
      return 'Interrupted • Mic ON, speak now...';
    }
    if (isSpeaking) {
      if (isUrdu) return 'اینیا بول رہی ہے • مائیک بند ہے (سننے کا وقت)';
      if (voiceConfig.language === 'it-IT') return 'ENIA sta parlando • Microfono spento';
      return 'ENIA Speaking • Microphone is OFF (Listening)';
    }
    if (isThinking) {
      if (isUrdu) return 'جواب تیار ہو رہا ہے • مائیک بند ہے...';
      if (voiceConfig.language === 'it-IT') return 'Elaborazione in corso • Microfono spento...';
      return 'Quantum processing • Microphone is OFF...';
    }
    if (isListening) {
      if (isUrdu) return 'مائیک آن ہے • اب آپ فرمائیے (بولیے یا لکھیے)';
      if (voiceConfig.language === 'it-IT') return 'Microfono ACCESO • Adesso tocca a te!';
      return 'Microphone ON • Your turn, speak or type naturally';
    }
    return 'Live Talk Connected';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage?.(inputText.trim());
    setInputText('');
  };

  const handleMicMouseDown = () => {
    if (isSpeaking) {
      onInterrupt();
      return;
    }
    setIsHoldingMic(true);
    onStartPushToTalk?.();
  };

  const handleMicMouseUp = () => {
    if (isHoldingMic) {
      setIsHoldingMic(false);
      onStopPushToTalk?.();
    }
  };

  // Spectral rainbow colors for equalizer bars
  const spectralColors = [
    '#ff007a',
    '#ec4899',
    '#d946ef',
    '#a855f7',
    '#6366f1',
    '#3b82f6',
    '#06b6d4',
    '#10b981',
    '#22c55e',
    '#eab308',
    '#f59e0b',
    '#ff007a',
  ];

  // Minimized floating bubble
  if (isMinimized) {
    return (
      <div
        id="live-talk-minimized"
        className="fixed bottom-24 right-5 z-50 flex items-center gap-3 p-3 rounded-2xl bg-[var(--panel-card)] border border-[var(--panel-border)] shadow-2xl backdrop-blur-xl animate-fadeIn text-[var(--text-main)]"
      >
        <div className="relative">
          <div className="absolute -inset-1 rounded-full rainbow-halo animate-spin-conic opacity-70 blur-[2px]" />
          <div
            onClick={onInterrupt}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md ${
              isSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-pink-500 text-white'
                : isListening
                ? 'bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title={isSpeaking ? 'Tap to interrupt' : isListening ? 'Mic Active' : 'Mic Off'}
          >
            {isSpeaking ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? 'bg-indigo-500 animate-ping'
                  : isListening
                  ? 'bg-emerald-500 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-black tracking-wide">LIVE TALK</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 font-bold">
              {currentLang.flag}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px] font-medium">
            {isSpeaking ? 'Speaking (Mic OFF)' : isThinking ? 'Thinking...' : 'Your Turn (Mic ON)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-indigo-600"
            title="Expand Live Talk"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white"
            title="End Live Talk"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full-screen / Focused Immersive View
  return (
    <div
      id="live-talk-modal"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[var(--bg-base)]/95 backdrop-blur-3xl text-[var(--text-main)] p-3 sm:p-5 overflow-hidden animate-fadeIn select-none transition-colors"
    >
      {/* Background ambient lighting - Futuristic Aurora */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-cyan-500/15 to-pink-500/15 blur-3xl pointer-events-none" />

      {/* Top Header with Futuristic HUD telemetry */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Talk pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-black tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>LIVE TALK</span>
          </div>

          {/* Mode Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--panel-card)] border border-[var(--panel-border)] text-xs text-indigo-600 font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{isUrdu ? 'آلٹرنیٹنگ ٹاک موڈ (صاف آواز)' : 'Alternating Turn-Taking'}</span>
          </div>

          {/* Creator Pill Badge */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>CREATOR: NOMAN (نعمان)</span>
          </div>
        </div>

        {/* Language selector & control actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-xl p-1 gap-1 shadow-xs">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  voiceConfig.language === lang.code
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={`Switch language to ${lang.label}`}
              >
                <span>{lang.flag}</span>
                <span className="hidden sm:inline">{lang.nativeLabel}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl bg-[var(--panel-card)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--panel-border)] shadow-xs transition-all"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Interactive Orb & Conversation Stage */}
      <div className="flex-1 flex flex-col items-center justify-between relative z-10 py-2 max-w-2xl mx-auto w-full text-center overflow-hidden">
        {/* Real-time Status Badge */}
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-300 mt-1 mb-2 flex items-center gap-2 shadow-xs ${
            wasInterrupted
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 animate-bounce'
              : isSpeaking
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700'
              : isThinking
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700'
              : isListening
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 ring-2 ring-emerald-400/30'
              : 'bg-[var(--panel-card)] border-[var(--panel-border)] text-[var(--text-muted)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSpeaking
                ? 'bg-indigo-600 animate-ping'
                : isThinking
                ? 'bg-cyan-500 animate-spin'
                : isListening
                ? 'bg-emerald-500 animate-ping'
                : 'bg-slate-400'
            }`}
          />
          <span>{getStatusText()}</span>
        </div>

        {/* Central Orb Container with ROTATING RAINBOW HALO ("سرکل کے اس پاس کلرنگ گھوم رہی ہو") */}
        <div
          className="relative group cursor-pointer my-auto flex items-center justify-center"
          onClick={() => {
            if (isSpeaking) {
              onInterrupt();
            } else if (!isHoldingMic && !isThinking) {
              onStartPushToTalk?.();
              setTimeout(() => {
                onStopPushToTalk?.();
              }, 4000);
            }
          }}
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onTouchStart={handleMicMouseDown}
          onTouchEnd={handleMicMouseUp}
          title={isSpeaking ? 'Tap to interrupt' : isListening ? 'Microphone is ON • Speak now' : 'Tap to speak'}
        >
          {/* LAYER 1: Outermost rotating vibrant rainbow halo ("سرکل کے اس پاس کلرنگ گھوم رہی ہو اینیمیشن والی") */}
          <div className="absolute -inset-8 sm:-inset-10 rounded-full rainbow-halo animate-spin-conic opacity-85 blur-xl pointer-events-none" />

          {/* LAYER 2: Fast counter-rotating neon cyber halo */}
          <div className="absolute -inset-4 sm:-inset-5 rounded-full cyber-halo animate-spin-conic-fast opacity-90 blur-sm pointer-events-none" />

          {/* LAYER 3: Gyroscopic dashed radar ring */}
          <div className="absolute -inset-10 sm:-inset-12 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin-conic-reverse pointer-events-none" />

          {/* LAYER 4: Orbiting colorful energy particle sparks revolving around the circle */}
          <div className="absolute w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_15px_#ec4899] animate-orbit-1 pointer-events-none" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-orbit-2 pointer-events-none" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-orbit-3 pointer-events-none" />

          {/* Core Interactive Sphere */}
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center p-1.5 transition-all duration-300 shadow-2xl relative z-10 ${
              isSpeaking
                ? 'scale-105 shadow-[0_0_80px_rgba(99,102,241,0.6)]'
                : isThinking
                ? 'scale-100 shadow-[0_0_60px_rgba(6,182,212,0.5)]'
                : isListening
                ? 'scale-105 shadow-[0_0_80px_rgba(16,185,129,0.7)] ring-4 ring-emerald-400/50'
                : 'shadow-[0_0_50px_rgba(99,102,241,0.35)]'
            }`}
            style={{
              background: isSpeaking
                ? 'linear-gradient(135deg, #6366f1, #06b6d4, #ec4899)'
                : isThinking
                ? 'linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)'
                : isListening
                ? 'linear-gradient(135deg, #10b981, #059669, #047857)'
                : 'linear-gradient(135deg, #6366f1, #3b82f6)',
            }}
          >
            <div className="w-full h-full rounded-full bg-[var(--panel-card)] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {/* Cyber laser scan line */}
              <div className="cyber-scanner-line" />

              {/* Internal rotating color vortex */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr ${
                  isSpeaking
                    ? 'from-indigo-500/25 via-pink-500/20 to-cyan-500/25 animate-spin'
                    : isThinking
                    ? 'from-cyan-500/25 to-blue-500/25 animate-spin'
                    : isListening
                    ? 'from-emerald-500/30 to-teal-500/30 animate-spin'
                    : 'from-indigo-500/15 to-cyan-500/15'
                }`}
                style={{ animationDuration: isSpeaking ? '5s' : '9s' }}
              />

              <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
                {isSpeaking ? (
                  <>
                    <Volume2 className="w-10 h-10 text-indigo-600 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                      {isUrdu ? 'اینیا بول رہی ہے (مائیک بند)' : 'ENIA Speaking (Mic OFF)'}
                    </span>
                  </>
                ) : isThinking ? (
                  <>
                    <Radio className="w-10 h-10 text-cyan-600 animate-spin" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-cyan-700 bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                      {isUrdu ? 'سوچ رہا ہوں (مائیک بند)' : 'Thinking (Mic OFF)'}
                    </span>
                  </>
                ) : isListening ? (
                  <>
                    <Mic className="w-10 h-10 text-emerald-600 animate-pulse" />
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 bg-emerald-500/20 px-3 py-0.5 rounded-full border border-emerald-400/50 shadow-sm">
                      {isUrdu ? 'مائیک آن ہے • بولیے!' : 'MIC ON • SPEAK NOW!'}
                    </span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-10 h-10 text-[var(--text-muted)]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      {isUrdu ? 'مائیک بند' : 'Mic Off'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Audio Visualizer Bars with Rainbow Spectral Waves */}
        <div className="flex items-center justify-center gap-1.5 h-8 my-2 px-4 py-1.5 rounded-full bg-[var(--panel-card)] border border-[var(--panel-border)] max-w-xs mx-auto shadow-sm">
          {Array.from({ length: 18 }).map((_, i) => {
            let height = 4;
            if (isSpeaking) {
              const wave = Math.sin((i / 18) * Math.PI * 3 + Date.now() / 150);
              height = Math.max(4, Math.round(16 + wave * 12));
            } else if (isListening) {
              const distance = Math.abs(i - 9) / 9;
              height = Math.max(4, Math.round((micVolume / 100) * (1 - distance * 0.7) * 26));
            }
            const color = spectralColors[i % spectralColors.length];
            return (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-75"
                style={{
                  height: `${height}px`,
                  backgroundColor: isSpeaking || isListening ? color : 'var(--text-subtle)',
                  boxShadow: isSpeaking || isListening ? `0 0 6px ${color}88` : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Real-time Subtitle & Dialogue Scroll Area */}
        <div className="w-full max-h-48 overflow-y-auto px-2 space-y-2 text-left" dir={isUrdu ? 'rtl' : 'ltr'}>
          {recentMessages.slice(-3).map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-2xl text-xs font-medium shadow-xs ${
                m.role === 'user'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 ml-auto max-w-[85%]'
                  : 'bg-[var(--panel-card)] border border-[var(--panel-border)] text-[var(--text-main)] mr-auto max-w-[85%]'
              }`}
            >
              <span className="block text-[10px] font-black text-[var(--text-muted)] mb-0.5 uppercase tracking-wider">
                {m.role === 'user' ? (isUrdu ? 'آپ:' : 'You:') : 'ENIA (نعمان):'}
              </span>
              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}

          {interimTranscript && (
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-900 dark:text-emerald-100 text-xs ml-auto max-w-[85%] animate-fadeIn">
              <span className="block text-[10px] font-black text-emerald-700 dark:text-emerald-300 mb-0.5 uppercase">
                {isUrdu ? 'آپ بول رہے ہیں...' : 'Speaking...'}
              </span>
              <p className="italic">"{interimTranscript}"</p>
            </div>
          )}

          {aiStreamingText && (
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-900 dark:text-indigo-100 text-xs mr-auto max-w-[85%] animate-fadeIn">
              <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-300 mb-0.5 uppercase">
                ENIA:
              </span>
              <p className="leading-relaxed whitespace-pre-wrap">{aiStreamingText}</p>
            </div>
          )}

          <div ref={dialogEndRef} />
        </div>
      </div>

      {/* Bottom Interactive Area: Instant Text Input + Controls */}
      <div className="w-full max-w-xl mx-auto z-10 flex flex-col gap-2 pt-2">
        {/* Instant In-Call Input Bar */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-2xl p-1.5 backdrop-blur-xl shadow-lg focus-within:border-indigo-400">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isUrdu
                ? 'کچھ بھی لکھیں یا بولیں (جیسے عام چیٹ پہ)...'
                : 'Type or speak anything (just like regular chat)...'
            }
            dir={isUrdu ? 'rtl' : 'ltr'}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-subtle)] font-medium"
          />

          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                onInterrupt();
              } else {
                onStartPushToTalk?.();
                setTimeout(() => onStopPushToTalk?.(), 4000);
              }
            }}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              isSpeaking
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : isListening
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600'
            }`}
            title={isSpeaking ? 'Interrupt speech' : 'Push to talk'}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:opacity-95 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer controls: Mic status pill & End Call */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {/* Live Mic State Indicator Pill */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-xs ${
                isSpeaking
                  ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-700'
                  : isListening
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700'
                  : 'bg-[var(--panel-card)] border-[var(--panel-border)] text-[var(--text-muted)]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isUrdu ? 'مائیک بند ہے (اینیا بول رہی ہے)' : 'Mic OFF (ENIA Speaking)'}</span>
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{isUrdu ? 'مائیک آن ہے (آپ بولیے)' : 'Mic ON (Your Turn)'}</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{isUrdu ? 'مائیک بند ہے' : 'Mic OFF'}</span>
                </>
              )}
            </div>

            {/* Mute button */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all text-xs ${
                isMuted
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 font-bold'
                  : 'bg-[var(--panel-card)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-indigo-600'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs tracking-wider uppercase shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'کال ختم کریں' : 'End Call'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
