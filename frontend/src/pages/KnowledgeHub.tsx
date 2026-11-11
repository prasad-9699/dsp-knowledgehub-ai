/**
 * DSP KnowledgeHub AI — Employee Conversational Intelligence Workspace
 * 
 * Clean, single-column centered conversational interface with:
 * - Dynamic 3D Welcome Hero (2-column desktop / stacked mobile)
 * - True Markdown rendering with bolding, lists, and tables (no exposed asterisks)
 * - Authoritative Citation Cards linking to authorized DSPAMC policy documents
 * - Contextual Source Viewer drawer (desktop right slide-out / mobile bottom sheet)
 * - Refined Floating Composer with auto-expand, Enter-to-send, and cancel state
 * - Smooth state transitions between idle, processing, and answered
 */

import React, { useState, useRef, useEffect } from 'react';
import { researchAPI } from '../services/api';
import type {
  CitationItem,
  ConversationRecord,
  ConversationMessage,
} from '../services/api';
import WelcomeHero from '../components/WelcomeHero';
import ChatMessage from '../components/ChatMessage';
import ChatComposer from '../components/ChatComposer';
import SourceViewer from '../components/SourceViewer';
import KnowledgeLibraryModal from '../components/KnowledgeLibraryModal';
import { Check, AlertCircle } from 'lucide-react';

export default function KnowledgeHub() {
  // Conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [coreState, setCoreState] = useState<'idle' | 'processing' | 'answered'>('idle');
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_dsp_welcome');

  // Source drawer state
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Start new conversation
  const handleStartNewChat = () => {
    const newId = `conv_${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([]);
    setInput('');
    setActiveCitation(null);
    setIsSourcePanelOpen(false);
    setCoreState('idle');
  };

  // Ask question workflow
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    // User Message
    const userMessage: ConversationMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setCoreState('processing');

    try {
      abortControllerRef.current = new AbortController();

      const response = await researchAPI.ask(textToSend, {}, activeConversationId);
      const data = response.data?.data;

      if (data) {
        // Map citation items cleanly
        const parsedCitations: CitationItem[] = (data.citations || data.sources || []).map((s: any) => ({
          document_id: s.document_id || s.id || 'DSP-POLICY',
          document_title: s.document_title || s.title || 'DSPAMC Policy Document',
          section: s.section || s.section_name || 'General Provisions',
          snippet: s.snippet || s.excerpt || s.content || '',
          relevance: s.relevance || s.score || 0.94,
          category: s.category || 'HR & Operations',
          verified: s.verified !== undefined ? s.verified : true,
          effective_date: s.effective_date || '2025-01-01',
          version: s.version || '2.0',
          excerpt: s.snippet || s.excerpt || s.content || '',
          relevance_score: s.relevance || s.score || 0.94,
          url: s.url || '',
        }));

        const assistantMessage: ConversationMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          citations: parsedCitations,
          follow_ups: data.follow_up_suggestions || [],
          warnings: data.warnings || [],
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        setCoreState('answered');

        // Automatically open first citation if user wants quick inspection
        if (parsedCitations.length > 0 && !activeCitation) {
          setActiveCitation(parsedCitations[0]);
        }

        // Save conversation record to backend
        await researchAPI.saveConversation({
          id: activeConversationId,
          title: textToSend.slice(0, 48),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: finalMessages,
        });
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error('Ask query error:', err);
        const errorMsg: ConversationMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content:
            'I encountered an issue connecting to the authorized knowledge retrieval service. Please try again or rephrase your query.',
          warnings: ['Network or backend service unavailable'],
          timestamp: new Date().toISOString(),
        };
        setMessages([...newMessages, errorMsg]);
      }
      setCoreState('idle');
    } finally {
      setLoading(false);
      // Smoothly return 3D to idle after answering
      setTimeout(() => setCoreState('idle'), 2500);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setCoreState('idle');
    showToast('Generation cancelled');
  };

  const handleCitationSelect = (citation: CitationItem) => {
    setActiveCitation(citation);
    setIsSourcePanelOpen(true);
  };

  const handleFeedback = async (messageId: string, rating: 'helpful' | 'not_helpful') => {
    try {
      await researchAPI.submitFeedback({
        message_id: messageId,
        rating,
      });
      showToast(rating === 'helpful' ? 'Marked as helpful' : 'Feedback recorded');
    } catch (e) {
      showToast('Feedback noted');
    }
  };

  return (
    <div className="knowledge-hub-container">
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────── */}
      {toastMessage && (
        <div className="hub-toast-banner" role="status">
          <Check style={{ width: 14, height: 14, color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── MAIN CHAT AREA (Centered) ────────────────────────────── */}
      <div className={`hub-chat-workspace ${isSourcePanelOpen ? 'has-source-panel' : ''}`}>
        <div className="hub-chat-inner">
          {messages.length === 0 ? (
            /* Welcome Hero Experience */
            <WelcomeHero
              onSelectPrompt={(promptText) => handleSendMessage(promptText)}
              coreState={coreState}
            />
          ) : (
            /* Conversational Message Stream */
            <div className="hub-messages-stream">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onCitationSelect={handleCitationSelect}
                  onFollowupSelect={(question) => handleSendMessage(question)}
                  onFeedback={handleFeedback}
                  activeCitation={activeCitation}
                />
              ))}

              {/* Real-time processing skeleton */}
              {loading && (
                <div className="assistant-loading-indicator">
                  <div className="loading-avatar-pulsing" />
                  <div className="loading-content-box">
                    <div className="loading-dots-row">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                    <span className="loading-label-text">
                      Retrieving authorized DSPAMC internal policies...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ─── FLOATING CHAT COMPOSER ─────────────────────────────── */}
        <div className="hub-floating-composer-anchor">
          <ChatComposer
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            onCancel={handleCancelGeneration}
            loading={loading}
          />
        </div>
      </div>

      {/* ─── CONTEXTUAL SOURCE DRAWER (Desktop slide-over / Mobile bottom sheet) ─── */}
      <SourceViewer
        citation={activeCitation}
        isOpen={isSourcePanelOpen}
        onClose={() => setIsSourcePanelOpen(false)}
        onOpenLibraryModal={() => setIsLibraryOpen(true)}
      />

      {/* ─── KNOWLEDGE LIBRARY MODAL ──────────────────────────────── */}
      {isLibraryOpen && (
        <KnowledgeLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}
    </div>
  );
}
