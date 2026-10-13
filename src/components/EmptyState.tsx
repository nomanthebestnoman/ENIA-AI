import React from 'react';
import { Mic, Sparkles, Code, Brain, Compass, MessageSquare, Radio, Zap } from 'lucide-react';
import { VoiceState } from '../types';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  onStartVoice: () => void;
  voiceState: VoiceState;
  language?: string;
  onStartLiveTalk?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectPrompt,
  onStartVoice,
  voiceState,
  language = 'en-US',
  onStartLiveTalk,
}) => {
  const getLocalizedContent = () => {
    if (language === 'it-IT') {
      return {
        greeting: (
          <>
            Ciao! Sono{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 bg-clip-text text-transparent">
              ENIA AI
            </span>
          </>
        ),
        subtitle:
          'Creata da Noman. Il tuo assistente vocale intelligente con architettura neurale quantistica.',
        micHint: 'Clicca per parlare con ENIA',
        suggestions: [
          {
            icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
            title: 'Saluto & Presentazione',
            prompt: 'Assalam-o-Alaikum! Ciao, come stai? Chi ti ha creato e quali sono le tue funzioni?',
          },
          {
            icon: <Brain className="w-4 h-4 text-indigo-500" />,
            title: 'Computazione quantistica',
            prompt: 'Spiegami in modo chiaro e intuitivo come funzionano i qubit e la sovrapposizione quantistica.',
          },
          {
            icon: <Code className="w-4 h-4 text-cyan-500" />,
            title: 'Codice TypeScript moderno',
            prompt: 'Scrivi un hook personalizzato React in TypeScript per gestire ricerche in tempo reale con debounce.',
          },
          {
            icon: <Compass className="w-4 h-4 text-pink-500" />,
            title: 'Cucina e cultura italiana',
            prompt: 'Raccontami la storia autentica della pizza napoletana e i segreti della lievitazione perfetta.',
          },
        ],
      };
    }

    if (language === 'ur-PK') {
      return {
        greeting: (
          <>
            السلام علیکم! میں ہوں{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 bg-clip-text text-transparent">
              اینیا اے آئی (ENIA)
            </span>
          </>
        ),
        subtitle:
          'مجھے بنانے والا نعمان ہے۔ جدید ترین فیوچرسٹک صوتی اور ٹیکسٹ اسسٹنٹ۔ مائیک آن کر کے بولیں یا نیچے دیے گئے کارڈز پر کلک کریں۔',
        micHint: 'مائیکروفون پر کلک کریں اور بولیں',
        suggestions: [
          {
            icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
            title: 'سلام اور تعارف',
            prompt: 'السلام علیکم! کیا حال ہے؟ آپ کا تعارف کیا ہے اور آپ کو کس نے بنایا؟',
          },
          {
            icon: <Brain className="w-4 h-4 text-indigo-500" />,
            title: 'مصنوعی ذہانت کے اصول',
            prompt: 'مصنوعی ذہانت (Artificial Intelligence) کیسے کام کرتی ہے؟ آسان اور پرکشش الفاظ میں سمجھائیں۔',
          },
          {
            icon: <Code className="w-4 h-4 text-cyan-500" />,
            title: 'جدید پروگرامنگ روڈ میپ',
            prompt: 'ویب ڈویلپمنٹ اور پروگرامنگ تیزی سے سیکھنے کے لیے بہترین طریقہ کار اور روڈ میپ بتائیں۔',
          },
          {
            icon: <Compass className="w-4 h-4 text-pink-500" />,
            title: 'کامیاب روزمرہ روٹین',
            prompt: 'ذہنی توجہ اور جسمانی توانائی بڑھانے کے لیے صبح کی مثالی اور بہترین روٹین کیا ہو سکتی ہے؟',
          },
        ],
      };
    }

    return {
      greeting: (
        <>
          Hello! I am{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 bg-clip-text text-transparent">
            ENIA AI
          </span>
        </>
      ),
      subtitle:
        'Created by Noman. Your next-generation neural voice & conversational AI assistant.',
      micHint: 'Click microphone to talk with ENIA',
      suggestions: [
        {
          icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
          title: 'Greeting & Creator',
          prompt: 'Assalam-o-Alaikum! Hello, how are you? Who created you and what can you do?',
        },
        {
          icon: <Brain className="w-4 h-4 text-indigo-500" />,
          title: 'Quantum Computing Explained',
          prompt: 'Explain the fundamental concepts of quantum superposition and qubits in a simple, intuitive way.',
        },
        {
          icon: <Code className="w-4 h-4 text-cyan-500" />,
          title: 'Modern TypeScript Hook',
          prompt: 'Write an idiomatic React TypeScript custom hook for debouncing search queries with cancel support.',
        },
        {
          icon: <Compass className="w-4 h-4 text-pink-500" />,
          title: 'Daily High-Performance Routine',
          prompt: 'Design an optimal daily morning routine for cognitive focus, physical energy, and creative productivity.',
        },
      ],
    };
  };

  const localized = getLocalizedContent();
  const isListening = voiceState === 'listening';

  return (
    <div
      id="enia-empty-state"
      className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 max-w-3xl mx-auto animate-fadeIn select-none"
    >
      {/* Central Futuristic Quantum Orb with Rotating Rainbow Ring */}
      <div className="relative mb-6 group flex items-center justify-center">
        {/* Outermost rotating rainbow halo ("سرکل کے اس پاس کلرنگ گھوم رہی ہو") */}
        <div className="absolute -inset-4 sm:-inset-6 rounded-full rainbow-halo animate-spin-conic opacity-70 blur-md pointer-events-none" />

        {/* Counter-rotating cybernetic dashed radar ring */}
        <div className="absolute -inset-7 sm:-inset-9 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin-conic-reverse pointer-events-none" />

        {/* Orbiting colorful energy satellites */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_12px_#ec4899] animate-orbit-1 pointer-events-none" />
        <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-orbit-2 pointer-events-none" />
        <div className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-orbit-3 pointer-events-none" />

        {/* Core Sphere */}
        <div
          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center p-1 transition-all duration-500 shadow-2xl relative z-10 ${
            isListening
              ? 'scale-110 shadow-[0_0_70px_rgba(244,63,94,0.6)]'
              : 'shadow-[0_0_60px_rgba(99,102,241,0.35)] group-hover:scale-105'
          }`}
          style={{
            background: isListening
              ? 'radial-gradient(circle, #f43f5e, #be123c)'
              : 'linear-gradient(135deg, #6366f1, #06b6d4, #ec4899)',
          }}
        >
          <div className="w-full h-full rounded-full bg-[var(--panel-card)] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Ambient cyber scanner line */}
            <div className="cyber-scanner-line" />

            {/* Inner colorful rotating wave */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-cyan-500/15 to-pink-500/20 animate-spin"
              style={{ animationDuration: '10s' }}
            />

            <button
              onClick={onStartVoice}
              title={isListening ? 'Click to stop listening' : localized.micHint}
              className="relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center text-[var(--text-main)] hover:scale-110 active:scale-95 transition-all group/btn"
            >
              <Mic
                className={`w-8 h-8 transition-colors ${
                  isListening
                    ? 'text-rose-500 animate-pulse'
                    : 'text-indigo-600 group-hover/btn:text-cyan-500'
                }`}
              />
              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-muted)] mt-1">
                {isListening ? 'LISTENING' : 'VOICE'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Greeting Headline */}
      <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight mb-2">
        {localized.greeting}
      </h2>
      <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-lg mb-6 leading-relaxed font-medium">
        {localized.subtitle}
      </p>

      {/* Start Live Talk Hero Action */}
      {onStartLiveTalk && (
        <div className="relative mb-8">
          <div className="absolute -inset-1 rounded-2xl rainbow-halo animate-spin-conic-fast opacity-60 blur-[3px]" />
          <button
            id="hero-start-live-talk-btn"
            onClick={onStartLiveTalk}
            className="relative px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl active:scale-95 transition-all flex items-center gap-2.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <Radio className="w-4 h-4 animate-pulse" />
            <span>
              {language === 'ur-PK'
                ? 'لائیو ٹاک شروع کریں (Live Talk)'
                : language === 'it-IT'
                ? 'Inizia Live Talk (A mani libere)'
                : 'Start Live Talk (Hands-Free)'}
            </span>
          </button>
        </div>
      )}

      {/* Quick Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {localized.suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--panel-card)] hover:bg-[var(--panel-bg)] border border-[var(--panel-border)] hover:border-indigo-400 text-left transition-all duration-200 group shadow-sm hover:shadow-md"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-[var(--text-main)] group-hover:text-indigo-600 truncate transition-colors">
                {item.title}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">
                {item.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
