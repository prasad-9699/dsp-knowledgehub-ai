import React from 'react';
import { FileText, ChevronRight, ShieldCheck, Calendar } from 'lucide-react';
import type { CitationItem } from '../services/api';

interface CitationCardProps {
  citation: CitationItem;
  index: number;
  isActive?: boolean;
  onSelect: (citation: CitationItem) => void;
}

export default function CitationCard({
  citation,
  index,
  isActive = false,
  onSelect,
}: CitationCardProps) {
  const relevancePct = citation.relevance_score
    ? Math.round(citation.relevance_score * 100)
    : 95;

  return (
    <button
      type="button"
      className={`citation-card-btn ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(citation)}
      title={`Inspect verbatim source from ${citation.document_title}`}
    >
      <div className="citation-header-row">
        <span className="citation-index-pill">[{index + 1}]</span>
        <span className="citation-doc-id">{citation.document_id}</span>
        <span className="citation-score-badge">{relevancePct}% match</span>
      </div>

      <div className="citation-body">
        <div className="citation-title">{citation.document_title}</div>
        {citation.section && (
          <div className="citation-section">§ {citation.section}</div>
        )}
      </div>

      <div className="citation-footer-row">
        {citation.effective_date && (
          <span className="citation-date">
            <Calendar style={{ width: 10, height: 10 }} />
            {citation.effective_date}
          </span>
        )}
        <span className="citation-action-link">
          Inspect source <ChevronRight style={{ width: 12, height: 12 }} />
        </span>
      </div>
    </button>
  );
}
