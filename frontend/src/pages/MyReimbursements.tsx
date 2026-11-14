import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Receipt,
  Download,
  Info,
  Calendar,
  Building,
  Check,
  Send,
  FileQuestion,
  FileCheck
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';
import type { ExpenseSummary, ExpenseClaimItem } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: 'Domestic & International Travel',
  LODGING: 'Hotel & Accommodation',
  MEALS: 'Client Entertainment & Meals',
  CONVEYANCE: 'Local Transport & Fuel',
  INTERNET_MOBILE: 'WFH Broadband & Mobile Bill',
  OTHER: 'General Business Expense',
};

function computeSummary(claimsList: ExpenseClaimItem[], code: string): ExpenseSummary {
  const pending = claimsList.filter((c) =>
    ['UNDER_REVIEW', 'SUBMITTED', 'PENDING', 'INFO_REQUIRED'].includes(c.status)
  );
  const approved = claimsList.filter((c) =>
    ['APPROVED', 'PAYMENT_PROCESSING'].includes(c.status)
  );
  const paid = claimsList.filter((c) => c.status === 'PAID');

  return {
    employee_code: code,
    total_claims: claimsList.length,
    pending_approval_count: pending.length,
    pending_approval_amount: pending.reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    approved_count: approved.length,
    approved_amount: approved.reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    paid_count: paid.length,
    paid_amount: paid.reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
    currency: 'INR',
  };
}

export default function MyReimbursements() {
  const { user } = useAppStore();
  const empCode = user?.employee_code || 'EMP-1001';
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [claims, setClaims] = useState<ExpenseClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaimItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('MEALS');
  const [expenseDate, setExpenseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFilename, setReceiptFilename] = useState('tax_invoice.pdf');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Clarification reply state in detail modal
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadExpenseData();
  }, [empCode]);

  const loadExpenseData = async () => {
    const storageKey = `dsp_claims_${empCode}`;
    let localClaims: ExpenseClaimItem[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localClaims = JSON.parse(stored);
      }
    } catch {
      // ignore parsing error
    }

    try {
      setLoading(true);
      const [sumRes, clmRes] = await Promise.all([
        selfServiceAPI.getExpenseSummary().catch(() => null),
        selfServiceAPI.getExpenseClaims().catch(() => null),
      ]);

      const serverClaims = clmRes?.data?.success && Array.isArray(clmRes.data.data) ? clmRes.data.data : null;
      const serverSummary = sumRes?.data?.success && sumRes.data.data ? sumRes.data.data : null;

      if (serverClaims && serverClaims.length > 0) {
        // Merge server claims with any local claims
        const mergedMap = new Map<string, ExpenseClaimItem>();
        localClaims.forEach((c) => mergedMap.set(c.id, c));
        serverClaims.forEach((c: ExpenseClaimItem) => mergedMap.set(c.id, c));
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.submitted_on).getTime() - new Date(a.submitted_on).getTime()
        );
        setClaims(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
        setSummary(computeSummary(merged, empCode));
      } else if (localClaims.length > 0) {
        setClaims(localClaims);
        setSummary(computeSummary(localClaims, empCode));
      } else if (serverSummary) {
        setSummary(serverSummary);
        setClaims([]);
      } else {
        setClaims([]);
        setSummary(computeSummary([], empCode));
      }
    } catch (err) {
      console.error('Failed to load expense records', err);
      if (localClaims.length > 0) {
        setClaims(localClaims);
        setSummary(computeSummary(localClaims, empCode));
      } else {
        setSummary(computeSummary([], empCode));
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptFilename(file.name);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (!expenseDate || isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please provide a valid transaction date and positive expense amount.');
      return;
    }

    if (!merchant.trim()) {
      setErrorMessage('Please specify the merchant or vendor name.');
      return;
    }

    if (!businessPurpose.trim()) {
      setErrorMessage('Please explain the business rationale and commercial purpose of this expense.');
      return;
    }

    try {
      setSubmitting(true);
      const storageKey = `dsp_claims_${empCode}`;

      // Create new claim item immediately
      const newClaim: ExpenseClaimItem = {
        id: 'clm_' + Date.now(),
        claim_number: `CLM-2026-${Math.floor(100 + Math.random() * 900)}`,
        employee_code: empCode,
        employee_name: user?.full_name || 'DSP Professional',
        category: category.toUpperCase(),
        category_label: CATEGORY_LABELS[category.toUpperCase()] || 'Business Expense',
        expense_date: expenseDate,
        amount: parsedAmount,
        currency: 'INR',
        merchant: merchant.trim(),
        business_purpose: businessPurpose.trim(),
        receipt_filename: receiptFilename || 'tax_invoice.pdf',
        receipt_url: `/api/v1/self-service/receipts/${receiptFilename || 'tax_invoice.pdf'}`,
        status: 'UNDER_REVIEW',
        submitted_on: new Date().toISOString(),
        approver_name: 'Vikram Malhotra',
        reviewer_comments: 'Pending manager review under DSP-FIN-001.',
        can_cancel: true,
      };

      // Asynchronously submit to backend (non-blocking)
      selfServiceAPI
        .submitExpenseClaim({
          category,
          expense_date: expenseDate,
          amount: parsedAmount,
          merchant: merchant.trim(),
          business_purpose: businessPurpose.trim(),
          receipt_filename: receiptFilename,
          notes: notes.trim() || undefined,
        })
        .catch(() => {});

      // Save locally and update state immediately
      const updatedClaims = [newClaim, ...claims];
      setClaims(updatedClaims);
      localStorage.setItem(storageKey, JSON.stringify(updatedClaims));
      setSummary(computeSummary(updatedClaims, empCode));

      showToast('Expense claim submitted for review and approval.');
      setShowSubmitModal(false);

      // Reset form
      setAmount('');
      setMerchant('');
      setBusinessPurpose('');
      setExpenseDate('');
      setNotes('');
      setReceiptFile(null);
      setReceiptFilename('tax_invoice.pdf');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit expense claim.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClaim = async (id: string, claimNum: string) => {
    if (!window.confirm(`Are you sure you want to cancel claim ${claimNum}?`)) {
      return;
    }

    try {
      const storageKey = `dsp_claims_${empCode}`;

      // Asynchronously inform backend
      selfServiceAPI.cancelExpenseClaim(id).catch(() => {});

      const updated = claims.map((c) =>
        c.id === id ? { ...c, status: 'CANCELLED', can_cancel: false } : c
      );
      setClaims(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSummary(computeSummary(updated, empCode));

      showToast(`Claim ${claimNum} has been cancelled.`);
      if (selectedClaim?.id === id) {
        setSelectedClaim(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to cancel claim.';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading your expense claims and reimbursement totals...</p>
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

      {/* ─── PAGE HEADER & SUBMIT BUTTON ────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <span className="badge-pulse-dot" />
            <span>GROUNDED POLICY FIN-001 WORKFLOW</span>
          </div>
          <h1 className="page-title">My Reimbursements &amp; Expenses</h1>
          <p className="page-subtext">
            Submit business expense claims, upload tax receipts, and track approval through payroll settlement.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary apply-leave-btn"
          onClick={() => {
            setErrorMessage(null);
            setShowSubmitModal(true);
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          <span>Submit Claim</span>
        </button>
      </div>

      {/* ─── 1. EXPENSE STATS METRICS ─────────────────────────────────── */}
      <div className="expense-stats-grid">
        <div className="expense-stat-card">
          <div className="stat-card-eyebrow">APPROVED FOR SETTLEMENT</div>
          <div className="stat-card-amount">
            INR {summary?.approved_amount?.toLocaleString('en-IN') ?? '0'}
          </div>
          <div className="stat-card-sub">
            {summary?.approved_count || 0} claims approved by manager
          </div>
        </div>

        <div className="expense-stat-card">
          <div className="stat-card-eyebrow">PENDING REVIEW</div>
          <div className="stat-card-amount" style={{ color: '#F59E0B' }}>
            INR {summary?.pending_approval_amount?.toLocaleString('en-IN') ?? '0'}
          </div>
          <div className="stat-card-sub">
            {summary?.pending_approval_count || 0} claims awaiting decision
          </div>
        </div>

        <div className="expense-stat-card">
          <div className="stat-card-eyebrow">YTD SETTLED DISBURSEMENTS</div>
          <div className="stat-card-amount" style={{ color: '#0D9488' }}>
            INR {summary?.paid_amount?.toLocaleString('en-IN') ?? '0'}
          </div>
          <div className="stat-card-sub">
            Disbursed to registered salary account
          </div>
        </div>
      </div>

      {/* ─── 2. CLAIMS HISTORY TABLE ────────────────────────────────── */}
      <div className="dashboard-card-section" style={{ marginTop: '2rem' }}>
        <div className="section-title-row">
          <h3>Submitted Claims &amp; Settlement Tracking</h3>
          <span className="table-count-tag">{claims.length} Claims on record</span>
        </div>

        <div className="requests-table-container">
          {claims.length === 0 ? (
            <div className="empty-table-hint">
              <CreditCard style={{ width: 32, height: 32, color: '#94A3B8', margin: '0 auto 0.5rem' }} />
              <p>No reimbursement claims found. Click "Submit Claim" above to file an expense.</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Merchant &amp; Purpose</th>
                  <th>Status</th>
                  <th>Reviewer &amp; Notes</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedClaim(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-semibold text-primary">{c.claim_number}</td>
                    <td>
                      <span className="table-cat-chip">{c.category_label || c.category}</span>
                    </td>
                    <td>{c.expense_date}</td>
                    <td className="font-semibold">
                      INR {c.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8125rem' }}>{c.merchant}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.business_purpose}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${c.status.toLowerCase()}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="approver-cell">
                      <div className="approver-info">
                        <span className="approver-name">{c.approver_name || 'Designated Approver'}</span>
                        {c.reviewer_comments && (
                          <span className="approver-note">"{c.reviewer_comments}"</span>
                        )}
                        {c.settlement_reference && (
                          <span className="settlement-ref">Ref: {c.settlement_reference}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.receipt_url ? (
                        <span
                          className="table-link-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(c);
                          }}
                        >
                          <Receipt style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
                          Receipt
                        </span>
                      ) : (
                        <span className="table-na-text">—</span>
                      )}
                    </td>
                    <td>
                      {c.can_cancel ? (
                        <button
                          type="button"
                          className="table-cancel-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelClaim(c.id, c.claim_number);
                          }}
                          title="Cancel claim"
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

      {/* ─── 3. SUBMIT CLAIM MODAL ──────────────────────────────────── */}
      {showSubmitModal && (
        <div
          className="modal-backdrop"
          onClick={() => !submitting && setShowSubmitModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
        >
          <div
            className="modal-card-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div className="modal-title-group">
                <span className="modal-eyebrow">SAP CONCUR EXPENSE DESK</span>
                <h2 id="claim-modal-title">Submit Reimbursement Claim</h2>
                <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Provide tax invoice receipts, transaction details, and verified business purpose.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                aria-label="Close submit claim modal"
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
            <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-form-body" style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
                
                {/* Expense Category */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="expenseCategorySelect" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Expense Category *
                  </label>
                  <select
                    id="expenseCategorySelect"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input-control"
                    required
                  >
                    <option value="MEALS">Client Entertainment &amp; Meals (Per diem allowance)</option>
                    <option value="CONVEYANCE">Local Transport &amp; Airport Taxi</option>
                    <option value="TRAVEL">Domestic &amp; International Travel (Flights/Rail)</option>
                    <option value="LODGING">Hotel &amp; Lodging Accommodation</option>
                    <option value="INTERNET_MOBILE">WFH Broadband &amp; Corporate Mobile Allowance</option>
                    <option value="OTHER">General Business Exigency</option>
                  </select>
                </div>

                {/* Amount and Date Side-by-side */}
                <div className="form-grid-2col" style={{ marginBottom: '1.125rem' }}>
                  <div className="form-group">
                    <label htmlFor="expenseAmountInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                      Amount (INR) *
                    </label>
                    <input
                      id="expenseAmountInput"
                      type="number"
                      step="0.01"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2450.00"
                      className="form-input-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="expenseDateInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                      Transaction Date *
                    </label>
                    <input
                      id="expenseDateInput"
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="form-input-control"
                      required
                    />
                  </div>
                </div>

                {/* Merchant Name */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="merchantNameInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Merchant / Vendor Name *
                  </label>
                  <input
                    id="merchantNameInput"
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Trident Hotel, Uber India, Airtel, Air India"
                    className="form-input-control"
                    required
                  />
                </div>

                {/* Business Purpose */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label htmlFor="businessPurposeInput" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Commercial Business Purpose *
                  </label>
                  <textarea
                    id="businessPurposeInput"
                    value={businessPurpose}
                    onChange={(e) => setBusinessPurpose(e.target.value)}
                    placeholder="Explain business justification (e.g. Institutional client portfolio quarterly review meeting)..."
                    rows={2}
                    className="form-input-control"
                    required
                  />
                </div>

                {/* Receipt Upload Dropzone */}
                <div className="form-group" style={{ marginBottom: '1.125rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                    Tax Invoice / Receipt Document
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <Upload style={{ width: 22, height: 22, color: '#0D9488', margin: '0 auto 0.375rem' }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                      {receiptFile ? receiptFile.name : 'Click to select invoice (PDF, JPG, PNG)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                      {receiptFile
                        ? `${(receiptFile.size / 1024).toFixed(1)} KB • Attached`
                        : 'Max file size 10MB • GST tax invoice reference'}
                    </div>
                  </div>
                </div>

                {/* Policy Notice */}
                <div className="form-info-notice" style={{ marginBottom: 0 }}>
                  <Info style={{ width: 16, height: 16, color: '#0284C7', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: '#0369A1' }}>
                    <strong>Expense Compliance Rules:</strong> All expenses require line manager sign-off and Finance audit. Approved reimbursements are settled via direct credit in the next monthly payroll run.
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer-actions" style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? 'Submitting to Concur...' : 'Submit Reimbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 4. CLAIM DETAIL / INSPECTION MODAL ──────────────────────── */}
      {selectedClaim && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedClaim(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div className="modal-title-group">
                <span className="modal-eyebrow">{selectedClaim.claim_number}</span>
                <h2>Claim Audit Details</h2>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setSelectedClaim(null)}
                aria-label="Close claim details"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div className="modal-form-body" style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    INR {selectedClaim.amount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {selectedClaim.category_label || selectedClaim.category} • Date: {selectedClaim.expense_date}
                  </div>
                </div>
                <span className={`status-pill status-${selectedClaim.status.toLowerCase()}`}>
                  {selectedClaim.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>MERCHANT & PURPOSE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedClaim.merchant}</div>
                <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: 4 }}>{selectedClaim.business_purpose}</div>
              </div>

              {/* Status Timeline */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>
                  SETTLEMENT WORKFLOW TIMELINE
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: '#0D9488', fontWeight: 600 }}>1. Submitted</span>
                  <span>→</span>
                  <span style={{ color: selectedClaim.status !== 'SUBMITTED' ? '#0D9488' : '#64748B', fontWeight: 600 }}>
                    2. Manager Review
                  </span>
                  <span>→</span>
                  <span style={{ color: selectedClaim.status === 'APPROVED' || selectedClaim.status === 'SETTLED' ? '#0D9488' : '#64748B', fontWeight: 600 }}>
                    3. Approved
                  </span>
                  <span>→</span>
                  <span style={{ color: selectedClaim.status === 'SETTLED' ? '#0D9488' : '#64748B', fontWeight: 600 }}>
                    4. Settled
                  </span>
                </div>
              </div>

              {/* Reviewer Comments */}
              {selectedClaim.reviewer_comments && (
                <div style={{ padding: '0.75rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>Reviewer Notes:</div>
                  <div style={{ fontSize: '0.8125rem', color: '#78350F', marginTop: 2 }}>"{selectedClaim.reviewer_comments}"</div>
                </div>
              )}

              {/* Settlement Reference */}
              {selectedClaim.settlement_reference && (
                <div style={{ padding: '0.75rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>Payroll Reference:</div>
                  <div style={{ fontSize: '0.8125rem', color: '#14532D', fontFamily: 'monospace', marginTop: 2 }}>{selectedClaim.settlement_reference}</div>
                </div>
              )}

              {/* Receipt File */}
              {selectedClaim.receipt_url && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt style={{ width: 16, height: 16, color: '#0D9488' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                      {selectedClaim.receipt_filename || 'gst_invoice.pdf'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#0D9488', fontWeight: 600 }}>
                    Attached Document
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer-actions" style={{ flexShrink: 0, borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              {selectedClaim.can_cancel ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCancelClaim(selectedClaim.id, selectedClaim.claim_number)}
                  style={{ color: '#DC2626' }}
                >
                  Cancel Claim
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedClaim(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
