import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Upload, Radio, Sparkles, Volume2 } from 'lucide-react';
import { VoiceState } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: (text?: string) => void;
  voiceState: VoiceState;
  onToggleVoiceInput: () => void;
  onStopOutput: () => void;
  interimTranscript: string;
  isStreaming: boolean;
  onAudioUpload?: (file: File) => void;
  onStartLiveTalk?: () => void;
  onOpenVoicePicker?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSendMessage,
  voiceState,
  onToggleVoiceInput,
  onStopOutput,
  interimTranscript,
  isStreaming,
  onAudioUpload,
  onStartLiveTalk,
  onOpenVoicePicker,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isListening = voiceState === 'listening';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || interimTranscript)) {
        onSendMessage();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAudioUpload) {
      onAudioUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div
      id="chat-input-dock"
      className="w-[min(950px,calc(100%-32px))] mx-auto pb-4 pt-2 relative z-20"
    >
      {/* Voice interim transcript banner if active */}
      {isListening && (
        <div
          id="listening-banner"
          className="mb-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-700 animate-fadeIn backdrop-blur-md shadow-sm"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span className="font-bold text-rose-600 flex-shrink-0">Listening:</span>
            <p className="truncate italic text-[var(--text-main)]">
              {interimTranscript || 'Speak clearly into your microphone...'}
            </p>
          </div>
          <button
            onClick={onToggleVoiceInput}
            className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 hover:bg-rose-500 hover:text-white ml-2 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Main futuristic input wrapper with glowing border */}
      <div className="relative flex items-end gap-2 p-2 bg-[var(--panel-card)] border border-[var(--panel-border)] rounded-2xl backdrop-blur-xl shadow-md focus-within:border-indigo-400 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
        {/* Hidden audio file upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="hidden"
          id="audio-file-input"
        />

        {/* Audio upload trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload audio for Gemini transcription"
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 transition-all flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Voice Dictation Button with Animated Aura */}
        <button
          id="mic-dictate-btn"
          type="button"
          onClick={onToggleVoiceInput}
          title={isListening ? 'Stop listening' : 'Start voice dictation'}
          className={`p-2.5 rounded-xl transition-all flex-shrink-0 relative ${
            isListening
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
              : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20'
          }`}
        >
          {isListening ? (
            <>
              <span className="absolute inset-0 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
              <MicOff className="w-4 h-4 relative z-10" />
            </>
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        {/* Live Talk Full-Duplex Button */}
        {onStartLiveTalk && (
          <button
            id="chat-live-talk-btn"
            type="button"
            onClick={onStartLiveTalk}
            title="Start Live Hands-Free Talk (Speak & Interrupt)"
            className="p-2.5 rounded-xl bg-gradient-to-r from-rose-500/15 to-pink-500/15 border border-rose-400/30 text-rose-600 hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
          >
            <Radio className="w-4 h-4" />
          </button>
        )}

        {/* Quick Voices Button ("وائسز") */}
        {onOpenVoicePicker && (
          <button
            id="chat-voices-btn"
            type="button"
            onClick={onOpenVoicePicker}
            title="وائس منتخب کریں (ہلکی پیاری، بھاری، لڑکے کی وائس وغیرہ)"
            className="px-2.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/25 transition-all flex items-center gap-1 text-xs font-extrabold flex-shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline text-[11px]">وائسز</span>
          </button>
        )}

        {/* Message Input Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask ENIA anything in English, Urdu (اردو), or Italian..."
          rows={1}
          className="flex-1 max-h-[140px] resize-none bg-transparent border-none outline-none py-2 px-1 text-[14.5px] text-[var(--text-main)] placeholder-[var(--text-subtle)] leading-normal font-medium"
        />

        {/* Send message button */}
        <button
          id="send-message-btn"
          type="button"
          disabled={!input.trim() && !interimTranscript}
          onClick={() => onSendMessage()}
          title="Send message (Enter)"
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:opacity-95 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
