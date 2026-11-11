import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import type { ConversationMessage, CitationItem } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';
import CitationCard from './CitationCard';

interface ChatMessageProps {
  message: ConversationMessage;
  onCitationSelect: (citation: CitationItem) => void;
  onFollowupSelect: (question: string) => void;
  onFeedback: (messageId: string, rating: 'helpful' | 'not_helpful') => void;
  onRetry?: (query: string) => void;
  activeCitation?: CitationItem | null;
}

export default function ChatMessage({
  message,
  onCitationSelect,
  onFollowupSelect,
  onFeedback,
  onRetry,
  activeCitation,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<'helpful' | 'not_helpful' | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRate = (rating: 'helpful' | 'not_helpful') => {
    setRated(rating);
    onFeedback(message.id, rating);
  };

  if (isUser) {
    return (
      <div className="chat-message-row user-row">
        <div className="user-message-bubble">
          <div className="message-content-text">{message.content}</div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="chat-message-row assistant-row">
      <div className="assistant-avatar">
        <Sparkles style={{ width: 14, height: 14 }} />
      </div>

      <div className="assistant-message-card">
        {/* Header with identity & verification badge */}
        <div className="assistant-card-header">
          <div className="assistant-identity">
            <span className="assistant-name">DSP KnowledgeHub</span>
            <span className="verified-evidence-badge">
              <ShieldCheck style={{ width: 11, height: 11 }} />
              Grounded in DSPAMC Policies
            </span>
          </div>

          <div className="message-actions-toolbar">
            <button
              type="button"
              className="action-btn"
              onClick={handleCopy}
              title="Copy answer"
              aria-label="Copy answer to clipboard"
            >
              {copied ? (
                <>
                  <Check style={{ width: 13, height: 13, color: '#10B981' }} />
                  <span className="action-btn-text">Copied</span>
                </>
              ) : (
                <>
                  <Copy style={{ width: 13, height: 13 }} />
                  <span className="action-btn-text">Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={`action-btn ${rated === 'helpful' ? 'rated-positive' : ''}`}
              onClick={() => handleRate('helpful')}
              title="Helpful answer"
              aria-label="Mark answer as helpful"
            >
              <ThumbsUp style={{ width: 13, height: 13 }} />
            </button>

            <button
              type="button"
              className={`action-btn ${rated === 'not_helpful' ? 'rated-negative' : ''}`}
              onClick={() => handleRate('not_helpful')}
              title="Not helpful"
              aria-label="Mark answer as not helpful"
            >
              <ThumbsDown style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Warning banner if insufficient grounding */}
        {message.warnings && message.warnings.length > 0 && (
          <div className="message-warning-banner">
            <AlertCircle style={{ width: 14, height: 14, color: '#F59E0B', flexShrink: 0 }} />
            <span>{message.warnings.join(' • ')}</span>
          </div>
        )}

        {/* Formatted Markdown Content */}
        <div className="assistant-markdown-content">
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Authoritative Citations Section */}
        {message.citations && message.citations.length > 0 && (
          <div className="citations-section-container">
            <div className="citations-section-header">
              <BookOpen style={{ width: 13, height: 13, color: '#0EA5E9' }} />
              <span>Authorized Source Citations ({message.citations.length})</span>
            </div>

            <div className="citations-grid">
              {message.citations.map((cite, idx) => (
                <CitationCard
                  key={`${cite.document_id}-${idx}`}
                  citation={cite}
                  index={idx}
                  isActive={activeCitation?.document_id === cite.document_id}
                  onSelect={onCitationSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Question Suggestions */}
        {message.follow_ups && message.follow_ups.length > 0 && (
          <div className="follow-ups-section">
            <div className="follow-ups-label">Suggested Follow-ups:</div>
            <div className="follow-ups-chips-wrap">
              {message.follow_ups.map((question, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="follow-up-chip"
                  onClick={() => onFollowupSelect(question)}
                >
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
