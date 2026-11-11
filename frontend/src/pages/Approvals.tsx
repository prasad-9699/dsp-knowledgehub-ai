import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  X,
  Send
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';
import type { PendingApprovalItem } from '../services/api';

export default function Approvals() {
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionModalItem, setDecisionModalItem] = useState<PendingApprovalItem | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO'>('APPROVE');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await selfServiceAPI.getPendingApprovals();
      if (res.data?.success && res.data.data) {
        setItems(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load approvals queue', err);
      setErrorMessage(err.response?.data?.detail || 'Unable to access approval queue.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openDecisionModal = (item: PendingApprovalItem, type: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    setDecisionModalItem(item);
    setDecisionType(type);
    setComments(
      type === 'APPROVE'
        ? 'Approved under authorized manager delegation.'
        : type === 'REJECT'
        ? 'Non-compliant with organizational guidelines.'
        : 'Please attach additional supporting documentation.'
    );
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalItem) return;

    try {
      setSubmitting(true);
      const res = await selfServiceAPI.processApprovalDecision({
        item_type: decisionModalItem.item_type,
        item_id: decisionModalItem.reference_number,
        decision: decisionType,
        comments: comments.trim(),
      });

      if (res.data?.success) {
        showToast(`Decision '${decisionType}' recorded for ${decisionModalItem.reference_number}.`);
        setDecisionModalItem(null);
        loadPendingApprovals();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to process decision.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading manager approval queue...</p>
      </div>
    );
  }

  return (
    <div className="self-service-page-container">
      {/* Toast */}
      {toastMessage && (
        <div className="hub-toast-banner" role="status">
          <CheckCircle2 style={{ width: 15, height: 15, color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── PAGE HEADER ────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <ShieldCheck style={{ width: 12, height: 12, color: '#0D9488' }} />
            <span>ROLE-PROTECTED MANAGER WORKSPACE</span>
          </div>
          <h1 className="page-title">Pending Approvals Queue</h1>
          <p className="page-subtext">
            Review and action leave applications and SAP Concur reimbursement claims submitted by your direct reportees.
          </p>
        </div>

        <div className="approval-stat-badge">
          <span className="count-num">{items.length}</span>
          <span className="count-label">Awaiting Decision</span>
        </div>
      </div>

      {/* ─── PENDING ITEMS LIST ─────────────────────────────────────── */}
      <div className="approvals-list-grid">
        {items.length === 0 ? (
          <div className="empty-table-hint" style={{ gridColumn: '1 / -1' }}>
            <CheckCircle2 style={{ width: 36, height: 36, color: '#10B981', margin: '0 auto 0.5rem' }} />
            <h3>All caught up!</h3>
            <p>You have zero pending leave applications or reimbursement claims awaiting review.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={`${item.item_type}-${item.id}`} className="approval-card-item">
              <div className="approval-card-header">
                <div className="approval-type-tag">
                  {item.item_type === 'LEAVE' ? (
                    <Calendar style={{ width: 14, height: 14, color: '#0D9488' }} />
                  ) : (
                    <CreditCard style={{ width: 14, height: 14, color: '#0284C7' }} />
                  )}
                  <span>{item.item_type} REQUEST</span>
                </div>
                <span className="approval-ref-pill">{item.reference_number}</span>
              </div>

              <div className="approval-requester-row">
                <div className="requester-avatar">{item.employee_name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="requester-name">{item.employee_name} ({item.employee_code})</div>
                  <div className="requester-dept">{item.department}</div>
                </div>
              </div>

              <div className="approval-content-box">
                <h4 className="approval-title">{item.title}</h4>
                <p className="approval-subtitle">{item.subtitle}</p>
                <div className="approval-dates-row">
                  <Clock style={{ width: 13, height: 13, color: '#64748B' }} />
                  <span>{item.date_summary}</span>
                </div>
                {item.amount && (
                  <div className="approval-amount-row">
                    <span>Claim Amount: </span>
                    <strong className="amount-val">₹{item.amount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="approval-actions-row">
                <button
                  type="button"
                  className="btn-decision btn-approve"
                  onClick={() => openDecisionModal(item, 'APPROVE')}
                >
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                  <span>Approve</span>
                </button>

                {item.item_type === 'EXPENSE' && (
                  <button
                    type="button"
                    className="btn-decision btn-request-info"
                    onClick={() => openDecisionModal(item, 'REQUEST_INFO')}
                  >
                    <HelpCircle style={{ width: 14, height: 14 }} />
                    <span>Request Info</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-decision btn-reject"
                  onClick={() => openDecisionModal(item, 'REJECT')}
                >
                  <XCircle style={{ width: 14, height: 14 }} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── DECISION CONFIRMATION MODAL ────────────────────────────── */}
      {decisionModalItem && (
        <div className="modal-backdrop" onClick={() => !submitting && setDecisionModalItem(null)}>
          <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-eyebrow">
                  DECISION: {decisionType} • {decisionModalItem.reference_number}
                </span>
                <h2>Confirm {decisionType.replace('_', ' ')} Decision</h2>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setDecisionModalItem(null)}
                disabled={submitting}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleExecuteDecision} className="modal-form-body">
              <div className="decision-summary-card">
                <p>
                  You are actioning <strong>{decisionModalItem.title}</strong> submitted by{' '}
                  <strong>{decisionModalItem.employee_name}</strong>.
                </p>
              </div>

              <div className="form-group">
                <label>Reviewer Decision Comments *</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Record mandatory justification or instructions for the employee..."
                  rows={3}
                  className="form-input-control"
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDecisionModalItem(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${
                    decisionType === 'APPROVE'
                      ? 'btn-primary'
                      : decisionType === 'REJECT'
                      ? 'btn-danger'
                      : 'btn-secondary'
                  }`}
                  disabled={submitting}
                >
                  {submitting ? 'Recording...' : `Confirm ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
