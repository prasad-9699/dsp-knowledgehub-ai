import React from 'react';
import { X, FileText, Calendar, ShieldCheck, Tag, ExternalLink, Bookmark } from 'lucide-react';
import type { CitationItem } from '../services/api';

interface SourceViewerProps {
  citation: CitationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLibraryModal?: () => void;
}

export default function SourceViewer({
  citation,
  isOpen,
  onClose,
  onOpenLibraryModal,
}: SourceViewerProps) {
  if (!isOpen || !citation) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="source-viewer-backdrop" onClick={onClose} />

      {/* Slide-out drawer on desktop / Bottom sheet on mobile */}
      <aside className="source-viewer-drawer" aria-label="Authorized Source Document Viewer">
        {/* Mobile handle */}
        <div className="source-mobile-drag-handle" />

        <div className="source-viewer-header">
          <div className="source-viewer-header-title">
            <div className="source-tag-pill">
              <ShieldCheck style={{ width: 12, height: 12, color: '#059669' }} />
              <span>AUTHORIZED RECORD</span>
            </div>
            <h3>Source Verification</h3>
          </div>
          <button
            type="button"
            className="source-close-btn"
            onClick={onClose}
            aria-label="Close document source viewer"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="source-viewer-scrollable">
          {/* Document metadata summary */}
          <div className="source-doc-card">
            <div className="source-doc-header">
              <span className="source-doc-code">{citation.document_id}</span>
              {citation.relevance_score && (
                <span className="source-relevance-chip">
                  {Math.round(citation.relevance_score * 100)}% Match
                </span>
              )}
            </div>

            <h4 className="source-doc-heading">{citation.document_title}</h4>

            {citation.section && (
              <div className="source-section-pill">
                <Bookmark style={{ width: 12, height: 12 }} />
                <span>Section: {citation.section}</span>
              </div>
            )}

            <div className="source-meta-grid">
              {citation.effective_date && (
                <div className="source-meta-item">
                  <span className="meta-label">Effective Date</span>
                  <span className="meta-value">
                    <Calendar style={{ width: 12, height: 12 }} />
                    {citation.effective_date}
                  </span>
                </div>
              )}
              {citation.version && (
                <div className="source-meta-item">
                  <span className="meta-label">Version</span>
                  <span className="meta-value">v{citation.version}</span>
                </div>
              )}
              <div className="source-meta-item">
                <span className="meta-label">Classification</span>
                <span className="meta-value">DSP Internal Confidential</span>
              </div>
              <div className="source-meta-item">
                <span className="meta-label">Authority</span>
                <span className="meta-value">DSPAMC Governance</span>
              </div>
            </div>
          </div>

          {/* Verbatim excerpt section */}
          <div className="source-excerpt-wrapper">
            <div className="source-excerpt-label">
              <FileText style={{ width: 14, height: 14 }} />
              <span>Grounded Document Excerpt</span>
            </div>
            <div className="source-excerpt-body">
              {citation.excerpt || 'Full text available in the DSPAMC Policy Library repository.'}
            </div>
          </div>

          {/* Citation Guidance Notice */}
          <div className="source-governance-notice">
            <ShieldCheck style={{ width: 14, height: 14, color: '#0284c7', flexShrink: 0 }} />
            <p>
              Information retrieved by DSP KnowledgeHub AI is indexed directly from approved DSPAMC HR and operational policies. For formal exceptions, contact the compliance or HR helpdesk.
            </p>
          </div>

          {/* Actions */}
          {onOpenLibraryModal && (
            <button
              type="button"
              className="source-library-link-btn"
              onClick={onOpenLibraryModal}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              <span>Inspect in Full Knowledge Library</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
