import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  X,
  Info,
  CalendarCheck,
  CalendarDays,
  ShieldAlert
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';
import type { LeaveBalancesSummary, LeaveRequestItem, LeaveCategoryBalance } from '../services/api';

/**
 * Calculates working days between start and end date, excluding weekends (Sat & Sun).
 */
function calculateLeaveDuration(
  startStr: string,
  endStr: string,
  halfDay: boolean
): { days: number; error: string | null } {
  if (!startStr || !endStr) return { days: 0, error: null };
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { days: 0, error: 'Invalid date selection' };
  }
  if (end < start) {
    return { days: 0, error: 'End date cannot be earlier than start date.' };
  }

  if (halfDay) {
    if (startStr !== endStr) {
      return { days: 0, error: 'Half-day leave must be on a single date (start and end dates must match).' };
    }
    const day = start.getDay();
    if (day === 0 || day === 6) {
      return { days: 0, error: 'Half-day leave cannot be booked on Saturday or Sunday.' };
    }
    return { days: 0.5, error: null };
  }

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (count === 0) {
    return { days: 0, error: 'Selected range falls entirely on weekends (Sat & Sun). Please select working days.' };
  }

  return { days: count, error: null };
}

const FALLBACK_LEAVE_CATEGORIES: LeaveCategoryBalance[] = [
  {
    category_id: 'pl',
    category_name: 'Privilege Leave (Annual)',
    code: 'PL',
    allocated: 18,
    used: 4,
    pending: 0,
    available: 14,
    description: 'Standard annual vacation quota for planned absence.',
  },
  {
    category_id: 'csl',
    category_name: 'Casual & Sick Leave',
    code: 'CSL',
    allocated: 12,
    used: 2,
    pending: 0,
    available: 10,
    description: 'Personal exigencies, health illness, or emergency leave.',
  },
  {
    category_id: 'co',
    category_name: 'Compensatory Off',
    code: 'CO',
    allocated: 2,
    used: 0,
    pending: 0,
    available: 2,
    description: 'Compensatory time off for approved weekend or holiday duty.',
  },
  {
    category_id: 'ml',
    category_name: 'Maternity / Parental Leave',
    code: 'ML',
    allocated: 26,
    used: 0,
    pending: 0,
    available: 26,
    description: 'Statutory parental leave as per Maternity Benefit Act.',
  },
];

export default function MyLeave() {
  const [balances, setBalances] = useState<LeaveBalancesSummary | null>(null);
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [categoryCode, setCategoryCode] = useState('PL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLeaveData();
  }, []);

  // Sync category code default when balances load
  useEffect(() => {
    if (balances?.categories?.length && !categoryCode) {
      setCategoryCode(balances.categories[0].code);
    }
  }, [balances]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes] = await Promise.all([
        selfServiceAPI.getLeaveBalances(),
        selfServiceAPI.getLeaveRequests(),
      ]);
      if (balRes.data?.success && balRes.data.data) {
        setBalances(balRes.data.data);
      }
      if (reqRes.data?.success && reqRes.data.data) {
        setRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load leave records', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Available Categories (API response with fallback)
  const availableCategories: LeaveCategoryBalance[] = useMemo(() => {
    return balances?.categories && balances.categories.length > 0
      ? balances.categories
      : FALLBACK_LEAVE_CATEGORIES;
  }, [balances]);

  // Selected Category Quota
  const selectedCategory: LeaveCategoryBalance | undefined = useMemo(() => {
    return availableCategories.find((c) => c.code === categoryCode) || availableCategories[0];
  }, [availableCategories, categoryCode]);

  // Duration calculation
  const calculatedDuration = useMemo(() => {
    return calculateLeaveDuration(startDate, endDate, isHalfDay);
  }, [startDate, endDate, isHalfDay]);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (isHalfDay || !endDate || endDate < val) {
      setEndDate(val);
    }
  };

  const handleHalfDayToggle = (checked: boolean) => {
    setIsHalfDay(checked);
    if (checked && startDate) {
      setEndDate(startDate);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!startDate || !endDate) {
      setErrorMessage('Please select valid start and end dates.');
      return;
    }

    if (calculatedDuration.error) {
      setErrorMessage(calculatedDuration.error);
      return;
    }

    if (calculatedDuration.days <= 0) {
      setErrorMessage('Please select a valid working date range.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a legitimate reason for this absence application.');
      return;
    }

    if (selectedCategory && calculatedDuration.days > selectedCategory.available) {
      setErrorMessage(
        `Requested duration (${calculatedDuration.days} days) exceeds available balance for ${selectedCategory.category_name} (${selectedCategory.available} days remaining).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await selfServiceAPI.applyLeave({
        category_code: categoryCode,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        reason: reason.trim(),
        handover_notes: handoverNotes.trim() || undefined,
      });

      if (res.data?.success) {
        showToast('Leave application submitted successfully. Request routed for manager review.');
        setShowApplyModal(false);
        // Reset form
        setReason('');
        setHandoverNotes('');
        setStartDate('');
        setEndDate('');
        setIsHalfDay(false);
        loadLeaveData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit leave application. Please check date range or balance.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: string, reqNum: string) => {
    if (!window.confirm(`Are you sure you want to cancel leave request ${reqNum}? Your balance quota will be restored.`)) {
      return;
    }

    try {
      const res = await selfServiceAPI.cancelLeave(id);
      if (res.data?.success) {
        showToast(`Request ${reqNum} cancelled. Balance quota has been restored.`);
        loadLeaveData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to cancel leave request.';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading your leave records and live balance quotas...</p>
      </div>
    );
  }

  return (
    <div className="self-service-page-container">
      {/* Toast */}
      {toastMessage && (
        <div className="hub-toast-banner" role="status">
          <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981', flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── PAGE HEADER & ACTION ────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <span className="badge-pulse-dot" />
            <span>GROUNDED POLICY HR-001 WORKFLOW</span>
          </div>
          <h1 className="page-title">My Leave &amp; Attendance</h1>
          <p className="page-subtext">
            Track statutory allocations, applied leaves, pending manager decisions, and public exchange holidays.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary apply-leave-btn"
          onClick={() => {
            setErrorMessage(null);
            setShowApplyModal(true);
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* ─── 1. BALANCE CARDS GRID ──────────────────────────────────── */}
      <div className="leave-categories-grid">
        {balances?.categories.map((cat) => (
          <div key={cat.code} className="leave-balance-card">
            <div className="leave-card-top">
              <span className="leave-cat-code">{cat.code}</span>
              <span className="leave-cat-available">{cat.available} <span className="cat-days-unit">Days Left</span></span>
            </div>

            <h3 className="leave-cat-name">{cat.category_name}</h3>
            <p className="leave-cat-desc">{cat.description}</p>

            <div className="leave-card-stats-row">
              <div className="stat-col">
                <span className="stat-label">Allocated</span>
                <span className="stat-val">{cat.allocated}</span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Used</span>
                <span className="stat-val">{cat.used}</span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Pending</span>
                <span className="stat-val">{cat.pending}</span>
              </div>
            </div>

            <div className="leave-progress-track">
              <div
                className="leave-progress-bar"
                style={{
                  width: `${cat.allocated > 0 ? Math.min(100, (cat.available / cat.allocated) * 100) : 0}%`,
                  backgroundColor: cat.code === 'PL' ? '#0D9488' : cat.code === 'CSL' ? '#0284C7' : '#F59E0B'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── 2. LEAVE REQUESTS HISTORY TABLE ────────────────────────── */}
      <div className="dashboard-card-section" style={{ marginTop: '2rem' }}>
        <div className="section-title-row">
          <h3>Leave Applications &amp; History</h3>
          <span className="table-count-tag">{requests.length} Requests on record</span>
        </div>

        <div className="requests-table-container">
          {requests.length === 0 ? (
            <div className="empty-table-hint">
              <CalendarCheck style={{ width: 32, height: 32, color: '#94A3B8', margin: '0 auto 0.5rem' }} />
              <p>No leave requests on record. Click "Apply for Leave" above to create an application.</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Category</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Approver &amp; Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-primary">{r.request_number}</td>
                    <td>
                      <span className="table-cat-chip">{r.category_name}</span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <span>{r.start_date}</span>
                        <span className="date-sep">to</span>
                        <span>{r.end_date}</span>
                      </div>
                    </td>
                    <td className="font-semibold">
                      {r.duration_days} {r.is_half_day ? '(Half)' : ''}
                    </td>
                    <td>
                      <span className={`status-pill status-${r.status.toLowerCase()}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="reason-cell" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="approver-cell">
                      <div className="approver-info">
                        <span className="approver-name">{r.approver_name || 'Designated Manager'}</span>
                        {r.approver_comments && (
                          <span className="approver-note">"{r.approver_comments}"</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.can_cancel ? (
                        <button
                          type="button"
                          className="table-cancel-btn"
                          onClick={() => handleCancelLeave(r.id, r.request_number)}
                          title="Cancel this leave request"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="table-na-text">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── 3. REDESIGNED MODAL DIALOG: APPLY FOR LEAVE ────────────── */}
      {showApplyModal && (
        <div
          className="modal-backdrop"
          onClick={() => !submitting && setShowApplyModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-modal-title"
        >
          <div
            className="modal-card-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div className="modal-title-group">
                <span className="modal-eyebrow">EMPLOYEE SELF-SERVICE</span>
                <h2 id="leave-modal-title">Apply for Leave</h2>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Submit an absence request for manager review and statutory attendance tracking.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowApplyModal(false)}
                disabled={submitting}
                aria-label="Close apply leave dialog"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="modal-error-banner" style={{ margin: '0 1.5rem', marginTop: '1rem', flexShrink: 0 }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#DC2626', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-form-body" style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
                
                {/* Leave Category with Live Balance */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="leaveCategorySelect" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Leave Category *
                  </label>
                  <select
                    id="leaveCategorySelect"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="form-input-control"
                    required
                    style={{ cursor: 'pointer', appearance: 'auto', color: '#0f172a', backgroundColor: '#ffffff' }}
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat.code} value={cat.code} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                        {cat.category_name} ({cat.available} Days Available)
                      </option>
                    ))}
                  </select>
                  {selectedCategory && (
                    <span style={{ fontSize: '0.75rem', color: '#0D9488', marginTop: '0.25rem', display: 'block' }}>
                      {selectedCategory.description} • Quota remaining: {selectedCategory.available} of {selectedCategory.allocated} days.
                    </span>
                  )}
                </div>

                {/* Side-by-side Date Fields on Desktop / Stacked on Mobile */}
                <div className="form-grid-2col" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="startDateInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                      Start Date *
                    </label>
                    <input
                      id="startDateInput"
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="form-input-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDateInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                      End Date *
                    </label>
                    <input
                      id="endDateInput"
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isHalfDay}
                      className="form-input-control"
                      required
                    />
                  </div>
                </div>

                {/* Duration Calculation & Half Day Option */}
                <div style={{
                  background: calculatedDuration.error ? '#FEF2F2' : '#F0FDFA',
                  border: `1px solid ${calculatedDuration.error ? '#FECACA' : '#CCFBF1'}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarDays style={{ width: 18, height: 18, color: calculatedDuration.error ? '#DC2626' : '#0D9488' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: calculatedDuration.error ? '#DC2626' : '#0F766E' }}>
                        {calculatedDuration.error
                          ? 'Date Range Notice'
                          : `Calculated Duration: ${calculatedDuration.days} ${calculatedDuration.days === 1 ? 'Working Day' : 'Working Days'}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: calculatedDuration.error ? '#B91C1C' : '#115E59' }}>
                        {calculatedDuration.error || (isHalfDay ? 'Half-day booked (0.5 day deduction)' : 'Weekends (Sat & Sun) are automatically excluded')}
                      </div>
                    </div>
                  </div>

                  {/* Half-Day Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={isHalfDay}
                      onChange={(e) => handleHalfDayToggle(e.target.checked)}
                      style={{ accentColor: '#0D9488', width: 16, height: 16 }}
                    />
                    <span>Half-Day Option</span>
                  </label>
                </div>

                {/* Business Reason Textarea */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="leaveReasonText" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Reason for Absence *
                  </label>
                  <textarea
                    id="leaveReasonText"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide explanatory context for this absence request..."
                    rows={3}
                    className="form-input-control"
                    required
                  />
                </div>

                {/* Optional Handover Notes */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="handoverNotesText" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Colleague Handover Notes (Optional)
                  </label>
                  <textarea
                    id="handoverNotesText"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="Specify covering colleagues and key portfolio or task handovers..."
                    rows={2}
                    className="form-input-control"
                  />
                </div>

                {/* Policy Information Box (Generic rules from workflow, no hardcoded manager names) */}
                <div className="form-info-notice" style={{ marginBottom: 0 }}>
                  <Info style={{ width: 16, height: 16, color: '#0284C7', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: '#0369A1' }}>
                    <strong>Leave Policy Governance:</strong> Submitting this application will route it to your designated manager for approval. Leave is only confirmed once approved. Unapproved absences may be flagged in PeoplePulse.
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer-actions" style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApplyModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || Boolean(calculatedDuration.error) || calculatedDuration.days <= 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
