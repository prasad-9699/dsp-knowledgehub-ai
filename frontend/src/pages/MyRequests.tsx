import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  Tag,
  ShieldAlert,
  User,
  ArrowRight
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';
import type { ServiceRequestItem } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const CATEGORY_NAMES: Record<string, string> = {
  IT_ACCESS: 'IT Access & Accounts',
  HARDWARE: 'Hardware & Devices',
  HR_BENEFITS: 'HR Benefits & Leaves',
  FACILITIES: 'Facilities & Workplace',
  FINANCE_EXPENSE: 'Finance & Expense Inquiry',
};

export default function MyRequests() {
  const { user } = useAppStore();
  const empCode = user?.employee_code || 'EMP-1001';
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceRequestItem | null>(null);
  const [commentText, setCommentText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('IT_ACCESS');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [empCode]);

  const loadRequests = async () => {
    const storageKey = `dsp_requests_${empCode}`;
    let localReqs: ServiceRequestItem[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) localReqs = JSON.parse(stored);
    } catch {
      // ignore
    }

    try {
      setLoading(true);
      const res = await selfServiceAPI.getServiceRequests().catch(() => null);
      const serverReqs = res?.data?.success && Array.isArray(res.data.data) ? res.data.data : null;

      if (serverReqs && serverReqs.length > 0) {
        const mergedMap = new Map<string, ServiceRequestItem>();
        localReqs.forEach((r) => mergedMap.set(r.id, r));
        serverReqs.forEach((r: ServiceRequestItem) => mergedMap.set(r.id, r));
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRequests(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } else if (localReqs.length > 0) {
        setRequests(localReqs);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to load service desk requests', err);
      if (localReqs.length > 0) setRequests(localReqs);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim() || !description.trim()) {
      setErrorMessage('Please provide a subject title and detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      const storageKey = `dsp_requests_${empCode}`;

      const newTicket: ServiceRequestItem = {
        id: 'req_' + Date.now(),
        request_number: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
        employee_code: empCode,
        employee_name: user?.full_name || 'DSP Professional',
        category,
        category_label: CATEGORY_NAMES[category] || category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: 'SUBMITTED',
        assigned_team: 'Service Desk Operations',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [],
      };

      // Background API sync
      selfServiceAPI
        .createServiceRequest({
          category,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        })
        .catch(() => {});

      const updated = [newTicket, ...requests];
      setRequests(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      showToast('Service ticket created and assigned to the relevant support team.');
      setShowCreateModal(false);
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create request.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    try {
      const res = await selfServiceAPI.addServiceRequestComment(selectedTicket.id, commentText.trim());
      if (res.data?.success && res.data.data) {
        setCommentText('');
        setSelectedTicket(res.data.data);
        showToast('Response added to ticket timeline.');
        loadRequests();
      }
    } catch (err) {
      alert('Failed to add response to ticket.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Connecting to DSPAMC Internal ServiceHub...</p>
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

      {/* ─── PAGE HEADER & NEW TICKET BUTTON ────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <span className="badge-pulse-dot" />
            <span>UNIFIED INTERNAL SERVICEHUB</span>
          </div>
          <h1 className="page-title">My Requests &amp; Service Desk</h1>
          <p className="page-subtext">
            Raise and track IT access permissions, hardware upgrades, HR letters, bonafide certificates, and facilities requests.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary apply-leave-btn"
          onClick={() => {
            setErrorMessage(null);
            setShowCreateModal(true);
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          <span>New Request</span>
        </button>
      </div>

      {/* ─── REQUESTS LIST CARDS ────────────────────────────────────── */}
      <div className="tickets-list-container">
        {requests.length === 0 ? (
          <div className="empty-table-hint">
            <LifeBuoy style={{ width: 32, height: 32, color: '#94A3B8', margin: '0 auto 0.5rem' }} />
            <p>You have no open tickets. Click "New Request" to get assistance.</p>
          </div>
        ) : (
          requests.map((ticket) => (
            <div
              key={ticket.id}
              className="ticket-card-item"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="ticket-card-header">
                <div className="ticket-title-group">
                  <span className="ticket-ref-code">{ticket.request_number}</span>
                  <span className="ticket-cat-label">{ticket.category_label}</span>
                </div>
                <div className="ticket-badge-group">
                  <span className={`priority-tag priority-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority} PRIORITY
                  </span>
                  <span className={`status-pill status-${ticket.status.toLowerCase()}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <h3 className="ticket-subject">{ticket.subject}</h3>
              <p className="ticket-description-snippet">{ticket.description}</p>

              <div className="ticket-card-footer">
                <div className="ticket-assignee-row">
                  <User style={{ width: 13, height: 13, color: '#64748B' }} />
                  <span>Assigned: {ticket.assignee_name || ticket.assigned_team}</span>
                </div>
                <div className="ticket-date-row">
                  <Clock style={{ width: 13, height: 13, color: '#94A3B8' }} />
                  <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.comments?.length > 0 && (
                    <span className="comments-count-chip">
                      <MessageSquare style={{ width: 11, height: 11 }} />
                      {ticket.comments.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── CREATE REQUEST MODAL ───────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowCreateModal(false)}>
          <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-eyebrow">INTERNAL SERVICEHUB</span>
                <h2>Create Service Request</h2>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {errorMessage && (
              <div className="modal-error-banner">
                <AlertCircle style={{ width: 16, height: 16, color: '#DC2626', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="modal-form-body">
              <div className="form-grid-2col">
                <div className="form-group">
                  <label>Request Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input-control"
                    required
                  >
                    <option value="IT_ACCESS">IT Access / Bloomberg / Market Data</option>
                    <option value="HARDWARE">Laptop &amp; Hardware Peripherals</option>
                    <option value="SOFTWARE">Software &amp; Specialized Licenses</option>
                    <option value="HR_INQUIRY">HR &amp; People Policy Inquiries</option>
                    <option value="HR_DOCUMENT">Employment / Visa Bonafide Letter</option>
                    <option value="TRAVEL_DESK">Corporate Travel Desk Assistance</option>
                    <option value="FACILITIES">Facilities &amp; Office Access Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-input-control"
                  >
                    <option value="LOW">Low (SLA 72h)</option>
                    <option value="MEDIUM">Medium (SLA 48h)</option>
                    <option value="HIGH">High (SLA 24h)</option>
                    <option value="URGENT">Urgent (Trading Critical)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Subject Title *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Bloomberg B-PIPE access required for equities analysis"
                  className="form-input-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Description &amp; Business Need *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide terminal ID, justification, or specific document requirements..."
                  rows={3}
                  className="form-input-control"
                  required
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TICKET DETAIL DRAWER ───────────────────────────────────── */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-detail-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-eyebrow">{selectedTicket.request_number} • {selectedTicket.category_label}</span>
                <h2>{selectedTicket.subject}</h2>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setSelectedTicket(null)}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="ticket-drawer-content">
              <div className="ticket-info-card">
                <div className="info-row">
                  <span className="lbl">Status</span>
                  <span className={`status-pill status-${selectedTicket.status.toLowerCase()}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="info-row">
                  <span className="lbl">Assigned Team</span>
                  <span className="val">{selectedTicket.assigned_team}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Lead Assignee</span>
                  <span className="val">{selectedTicket.assignee_name || 'Unassigned'}</span>
                </div>
                <div className="info-row">
                  <span className="lbl">Priority</span>
                  <span className="val">{selectedTicket.priority}</span>
                </div>
              </div>

              <div className="ticket-description-box">
                <h4>Original Request</h4>
                <p>{selectedTicket.description}</p>
              </div>

              {/* Timeline & Comments */}
              <div className="ticket-comments-section">
                <h4>Timeline &amp; Responses ({selectedTicket.comments?.length || 0})</h4>
                {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                  <div className="comments-stream">
                    {selectedTicket.comments.map((c) => (
                      <div key={c.id} className="comment-bubble">
                        <div className="comment-header">
                          <span className="comment-author">{c.author_name} ({c.author_role})</span>
                          <span className="comment-time">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="comment-msg">{c.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-subtext">No updates yet from the assigned team.</p>
                )}

                {/* Add Response */}
                <form onSubmit={handleAddComment} className="comment-input-form">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Provide additional details or reply to support team..."
                    className="form-input-control"
                  />
                  <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
