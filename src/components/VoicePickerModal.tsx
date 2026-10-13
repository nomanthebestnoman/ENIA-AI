import React from 'react';
import { X, Volume2, Play, Square, Check, Sparkles, User, Shield, Zap, Wind, Mic, Heart } from 'lucide-react';
import { VoiceConfig, GeminiVoiceName } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export interface VoiceOption {
  id: GeminiVoiceName;
  nameUrdu: string;
  nameEn: string;
  descUrdu: string;
  descEn: string;
  tagUrdu: string;
  gender: 'female' | 'male';
  icon: React.ReactNode;
  gradient: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Aoede',
    nameUrdu: 'نوجوان لڑکی کی پیاری آواز',
    nameEn: 'Youthful Girl (Young Girl)',
    descUrdu: 'نوجوان لڑکی کی معصوم، شوخ، میٹھی اور پرکشش آواز جو گفتگو کو خوشگوار بناتی ہے',
    descEn: 'Bright, youthful, melodic, and cheerful young girl tone',
    tagUrdu: 'نوجوان لڑکی 👧✨',
    gender: 'female',
    icon: <Heart className="w-5 h-5 text-fuchsia-500" />,
    gradient: 'from-fuchsia-500/15 via-pink-500/10 to-rose-500/15',
  },
  {
    id: 'Boy',
    nameUrdu: 'نوجوان لڑکے کی شوخ آواز',
    nameEn: 'Youthful Boy (Boy)',
    descUrdu: 'نوجوان لڑکے کی شوخ، چست اور پرجوش آواز، دوستانہ اور زندہ دل انداز',
    descEn: 'Lively, friendly young boy persona with cheerful intonation',
    tagUrdu: 'نوجوان لڑکا 👦⚡',
    gender: 'male',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    gradient: 'from-amber-500/15 via-orange-500/10 to-pink-500/15',
  },
  {
    id: 'Kore',
    nameUrdu: 'ہلکی اور پیاری وائس',
    nameEn: 'Soft & Sweet (Kore)',
    descUrdu: 'ہلکی، پیاری، میٹھی اور پرسکون نسوانی آواز جو سننے میں نہایت دلکش ہے',
    descEn: 'Warm, soft, expressive, and gentle tone',
    tagUrdu: 'پیاری وائس 🌸',
    gender: 'female',
    icon: <Sparkles className="w-5 h-5 text-pink-500" />,
    gradient: 'from-pink-500/15 via-rose-500/10 to-indigo-500/15',
  },
  {
    id: 'Charon',
    nameUrdu: 'بھاری اور پروقار وائس',
    nameEn: 'Deep & Authoritative (Charon)',
    descUrdu: 'بھاری، گہری، سنجیدہ اور پروقار مردانہ آواز جو پُراعتماد انداز میں بات کرتی ہے',
    descEn: 'Deep, rich, resonant, and commanding voice',
    tagUrdu: 'بھاری آواز 🎙️',
    gender: 'male',
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    gradient: 'from-indigo-500/15 via-purple-500/10 to-blue-500/15',
  },
  {
    id: 'Zephyr',
    nameUrdu: 'نرم اور دھیمی وائس',
    nameEn: 'Smooth & Calm (Zephyr)',
    descUrdu: 'دھیمی، نرم، سلجھی ہوئی اور جدید پرسکون آواز جو آرام دہ محسوس کراتی ہے',
    descEn: 'Smooth, modern, and relaxed cadence',
    tagUrdu: 'دھیمی وائس 🍃',
    gender: 'female',
    icon: <Wind className="w-5 h-5 text-teal-500" />,
    gradient: 'from-teal-500/15 via-cyan-500/10 to-emerald-500/15',
  },
  {
    id: 'Fenrir',
    nameUrdu: 'صاف اور سنجیدہ آواز',
    nameEn: 'Crisp & Articulate (Fenrir)',
    descUrdu: 'صاف، واضح اور صاف تلفظ والی مردانہ آواز جو ہر بات کو واضح بیان کرے',
    descEn: 'Crisp, articulate, focused, and clean timbre',
    tagUrdu: 'صاف آواز 🎯',
    gender: 'male',
    icon: <User className="w-5 h-5 text-cyan-500" />,
    gradient: 'from-cyan-500/15 via-sky-500/10 to-blue-500/15',
  },
];

interface VoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig: VoiceConfig;
  onSelectVoice: (voice: GeminiVoiceName) => void;
  onLanguageChange: (lang: string) => void;
  onPreviewVoice: (voice: GeminiVoiceName) => void;
  onStopPreview: () => void;
  isSpeaking: boolean;
  testingVoiceId: GeminiVoiceName | null;
}

export const VoicePickerModal: React.FC<VoicePickerModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onSelectVoice,
  onLanguageChange,
  onPreviewVoice,
  onStopPreview,
  isSpeaking,
  testingVoiceId,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="voice-picker-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl rainbow-halo animate-spin-conic opacity-70 blur-[1px]" />
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-cyan-500 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Volume2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                  وائس منتخب کریں (Choose Voice)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-600 font-extrabold">
                  {AVAILABLE_VOICES.length} VOICES
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                اپنی پسندیدہ آواز منتخب کریں: ہلکی پیاری، بھاری، لڑکے کی، یا نرم وائس
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs Quick Switch */}
        <div className="pt-3 pb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            زبان (Language):
          </span>
          <div className="flex items-center gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  voiceConfig.language === lang.code
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                    : 'bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-indigo-400'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2.5 custom-scrollbar pr-1">
          {AVAILABLE_VOICES.map((v) => {
            const isSelected = voiceConfig.geminiVoice === v.id;
            const isThisTesting = isSpeaking && testingVoiceId === v.id;

            return (
              <div
                key={v.id}
                onClick={() => onSelectVoice(v.id)}
                className={`relative group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r ' +
                      v.gradient +
                      ' border-indigo-500 ring-2 ring-indigo-400/40 shadow-md scale-[1.01]'
                    : 'bg-[var(--panel-bg)] border-[var(--panel-border)] hover:border-indigo-300 hover:bg-[var(--panel-card)]'
                }`}
              >
                {/* Voice Icon + Labels */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                      isSelected
                        ? 'bg-[var(--panel-card)] border-indigo-400/50 shadow-indigo-500/20'
                        : 'bg-[var(--panel-card)] border-[var(--panel-border)]'
                    }`}
                  >
                    {v.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight">
                        {v.nameUrdu}
                      </h3>
                      <span className="text-[11px] font-bold text-[var(--text-muted)]">
                        ({v.nameEn})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 font-extrabold border border-indigo-400/20">
                        {v.tagUrdu}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-black border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>فعال (Selected)</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                      {v.descUrdu}
                    </p>
                  </div>
                </div>

                {/* Actions: Test Play Button & Selection Radio */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isThisTesting) {
                        onStopPreview();
                      } else {
                        onPreviewVoice(v.id);
                      }
                    }}
                    title={isThisTesting ? 'Stop voice sample' : 'Listen to voice sample'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      isThisTesting
                        ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                        : 'bg-[var(--panel-card)] hover:bg-indigo-50 border border-[var(--panel-border)] text-indigo-600 hover:border-indigo-400'
                    }`}
                  >
                    {isThisTesting ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>روکیں</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>سنیں (Test)</span>
                      </>
                    )}
                  </button>

                  {/* Radio Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 shadow-sm'
                        : 'border-[var(--text-subtle)]'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Done button */}
        <div className="pt-3.5 border-t border-[var(--panel-border)] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            ✨ منتخب کردہ وائس خودکار طور پر لائیو ٹاک اور چیٹ میں لاگو ہو جائے گی۔
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 text-white text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            ٹھیک ہے (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
