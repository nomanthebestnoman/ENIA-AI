import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Volume2, Square, Copy, Check, User, Bot, AlertCircle, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isCurrentlySpeaking: boolean;
  onSpeak: (text: string, messageId: string) => void;
  onStopSpeaking: () => void;
  onRetry?: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentlySpeaking,
  onSpeak,
  onStopSpeaking,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(message.timestamp));

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2.5 my-3.5 group animate-fadeIn">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] md:max-w-[68%]">
          <div
            id={`user-message-${message.id}`}
            className="p-3.5 px-4.5 rounded-2xl rounded-br-xs text-white text-[14.5px] leading-relaxed shadow-[0_4px_20px_rgba(79,70,229,0.3)] select-text font-medium"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
            }}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <span className="text-[10px] text-[var(--text-subtle)] mt-1 px-1 font-medium">{formattedTime}</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start items-start gap-3 my-4 group animate-fadeIn">
      {/* Assistant Avatar with Rotating Rainbow Border */}
      <div className="relative flex-shrink-0 group/avatar">
        <div className="absolute -inset-0.5 rounded-xl rainbow-halo animate-spin-conic opacity-70 blur-[1px]" />
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-cyan-500 to-pink-500 p-[1.5px] shadow-sm">
          <div className="w-full h-full bg-[var(--panel-card)] rounded-[10px] flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Bubble Container */}
      <div className="flex flex-col items-start max-w-[92%] sm:max-w-[85%] md:max-w-[80%]">
        <div
          id={`assistant-message-${message.id}`}
          className={`w-full p-4.5 rounded-2xl rounded-tl-xs border transition-all ${
            message.hasError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[var(--panel-card)] border-[var(--panel-border)] shadow-sm backdrop-blur-xl'
          }`}
        >
          {/* Futuristic HUD Message Header */}
          {!message.hasError && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--panel-border)] text-[10px] text-[var(--text-muted)] font-semibold tracking-wider uppercase">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                <span className="text-indigo-600 font-bold">ENIA NEURAL CORE</span>
                <span className="text-[var(--text-subtle)]">• NOMAN ENGINE</span>
              </div>
              <div className="flex items-center gap-1 text-[var(--text-subtle)]">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>AI SYNTH</span>
              </div>
            </div>
          )}

          {message.hasError ? (
            <div className="flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error generating response</p>
                <p className="text-xs text-rose-600 mt-1">{message.content}</p>
                {onRetry && (
                  <button
                    onClick={() => onRetry(message)}
                    className="mt-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="enia-markdown text-[14.5px]">
              <Markdown>{message.content}</Markdown>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Message Footer Controls */}
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <span className="text-[10px] font-medium text-[var(--text-subtle)]">{formattedTime}</span>

          {!message.hasError && !message.isStreaming && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* Speak / Stop Button */}
              {isCurrentlySpeaking ? (
                <button
                  onClick={onStopSpeaking}
                  title="Stop audio playback"
                  className="p-1 px-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 text-[11px] font-bold border border-rose-300 shadow-xs"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => onSpeak(message.content, message.id)}
                  title="Read aloud with voice"
                  className="p-1 px-2 rounded-lg text-[var(--text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Listen</span>
                </button>
              )}

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                title="Copy response to clipboard"
                className="p-1 px-2 rounded-lg text-[var(--text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
