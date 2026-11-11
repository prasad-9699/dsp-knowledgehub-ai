import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, CornerDownLeft } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  loading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({
  input,
  setInput,
  onSend,
  onCancel,
  loading,
  disabled = false,
  placeholder = 'Ask anything about DSP leave policies, onboarding, IT access, expenses, or compliance...',
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-composer-wrapper">
      {/* Active processing state with Cancel control */}
      {loading && onCancel && (
        <div className="composer-processing-bar">
          <div className="processing-indicator">
            <span className="processing-pulse" />
            <span className="processing-text">Searching indexed DSPAMC policy records...</span>
          </div>
          <button
            type="button"
            className="composer-cancel-btn"
            onClick={onCancel}
            title="Stop generation"
          >
            <Square style={{ width: 10, height: 10, fill: 'currentColor' }} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Floating rounded composer container */}
      <div className={`chat-composer-container ${loading ? 'is-loading' : ''}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          className="chat-composer-textarea"
          aria-label="Message DSP KnowledgeHub AI assistant"
        />

        <div className="chat-composer-actions">
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || loading || !input.trim()}
            className="chat-composer-send-btn"
            aria-label="Send message"
            title="Send question (Enter)"
          >
            <Send style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      <div className="chat-composer-footer-hint">
        <span>Press <kbd>Enter ↵</kbd> to send</span>
        <span className="hint-divider">•</span>
        <span><kbd>Shift + Enter</kbd> for new line</span>
        <span className="hint-divider">•</span>
        <span>Answers cite authorized DSPAMC policies</span>
      </div>
    </div>
  );
}
