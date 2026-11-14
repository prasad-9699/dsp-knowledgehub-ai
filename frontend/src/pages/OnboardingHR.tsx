import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, CheckSquare, FileText, Shield, AlertCircle, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp, User, Building2,
  Calendar, Send, Eye, X, Search, Filter, Plus, Star, Target, Laptop2, UserCheck
} from 'lucide-react';
import { onboardingAPI } from '../services/api';
import type { OnboardingInstance, OnboardingTask, DocumentSubmission } from '../services/api';
import { useAppStore } from '../store/useAppStore';

// ─── Constants ───────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  PREBOARDING: 'Preboarding',
  DAY_1: 'Day 1',
  FIRST_WEEK: 'First Week',
  FIRST_30_DAYS: 'First 30 Days',
  COMPLETED: 'Completed',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Not Started', color: '#64748b' },
  IN_PROGRESS: { label: 'In Progress', color: '#0ea5e9' },
  SUBMITTED_FOR_REVIEW: { label: 'Submitted', color: '#8b5cf6' },
  COMPLETED: { label: 'Completed', color: '#10b981' },
  ACTION_REQUIRED: { label: 'Action Req.', color: '#f59e0b' },
  OVERDUE: { label: 'Overdue', color: '#ef4444' },
};

const DOC_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', color: '#8b5cf6' },
  VERIFIED: { label: 'Verified', color: '#10b981' },
  CORRECTION_REQUIRED: { label: 'Correction Req.', color: '#f59e0b' },
  REJECTED: { label: 'Rejected', color: '#ef4444' },
};

// ─── Employee Row ─────────────────────────────────────────────────────

function EmployeeRow({
  instance,
  onViewDetail,
}: {
  instance: OnboardingInstance;
  onViewDetail: (emp: OnboardingInstance) => void;
}) {
  const pct = instance.overall_completion_pct;
  const stage = STAGE_LABELS[instance.current_stage] || instance.current_stage;

  return (
    <div className="ob-hr-employee-row" onClick={() => onViewDetail(instance)}>
      <div className="ob-hr-emp-avatar">{instance.avatar_initials}</div>
      <div className="ob-hr-emp-info">
        <span className="ob-hr-emp-name">{instance.full_name}</span>
        <span className="ob-hr-emp-code">{instance.employee_code} • {instance.designation}</span>
        <span className="ob-hr-emp-dept">{instance.department}</span>
      </div>
      <div className="ob-hr-emp-stage">
        <span className="ob-hr-stage-badge">{stage}</span>
        <span className="ob-hr-joining-date">
          <Calendar size={12} /> {instance.joining_date}
        </span>
      </div>
      <div className="ob-hr-progress-bar-wrap">
        <div className="ob-hr-progress-bar">
          <div
            className="ob-hr-progress-fill"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? '#10b981' : pct > 50 ? '#0ea5e9' : '#f59e0b',
            }}
          />
        </div>
        <span className="ob-hr-pct-label">{pct}%</span>
      </div>
      <button className="ob-hr-view-btn" onClick={e => { e.stopPropagation(); onViewDetail(instance); }}>
        <Eye size={14} /> View
      </button>
    </div>
  );
}

// ─── Employee Detail Panel ────────────────────────────────────────────

function EmployeeDetailPanel({
  empCode,
  onClose,
}: {
  empCode: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'documents'>('tasks');

  // Task review
  const [reviewTaskId, setReviewTaskId] = useState('');
  const [reviewTaskEmpCode, setReviewTaskEmpCode] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  // Doc review
  const [docReviewId, setDocReviewId] = useState('');
  const [docReviewStatus, setDocReviewStatus] = useState('');
  const [docReviewComments, setDocReviewComments] = useState('');
  const [docReviewing, setDocReviewing] = useState(false);
  const [docReviewMsg, setDocReviewMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onboardingAPI.hrGetEmployeeStatus(empCode);
      if (res.data?.success) setDetail(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [empCode]);

  useEffect(() => { load(); }, [load]);

  const handleTaskReview = async () => {
    if (!reviewTaskId || !reviewStatus) return;
    setReviewing(true);
    setReviewMsg('');
    try {
      await onboardingAPI.hrReviewTask({
        task_id: reviewTaskId,
        employee_code: empCode,
        new_status: reviewStatus,
        comments: reviewComments || undefined,
      });
      setReviewMsg('✅ Task updated.');
      setReviewTaskId(''); setReviewStatus(''); setReviewComments('');
      await load();
    } catch (err: any) {
      setReviewMsg(err?.response?.data?.detail || 'Update failed.');
    } finally {
      setReviewing(false);
    }
  };

  const handleDocReview = async () => {
    if (!docReviewId || !docReviewStatus) return;
    setDocReviewing(true);
    setDocReviewMsg('');
    try {
      await onboardingAPI.hrReviewDocument({
        employee_code: empCode,
        submission_id: docReviewId,
        new_status: docReviewStatus,
        comments: docReviewComments || undefined,
      });
      setDocReviewMsg('✅ Document review recorded.');
      setDocReviewId(''); setDocReviewStatus(''); setDocReviewComments('');
      await load();
    } catch (err: any) {
      setDocReviewMsg(err?.response?.data?.detail || 'Review failed.');
    } finally {
      setDocReviewing(false);
    }
  };

  if (loading) return (
    <div className="ob-hr-detail-panel">
      <div className="ob-loading-spinner" style={{ margin: '3rem auto' }} />
    </div>
  );

  if (!detail) return null;

  const tasks: OnboardingTask[] = detail.all_tasks || [];
  const submissions: DocumentSubmission[] = detail.document_submissions || [];
  const instance: OnboardingInstance = detail.instance;
  const summary = detail.task_summary || {};

  return (
    <div className="ob-hr-detail-panel">
      <div className="ob-hr-detail-header">
        <div className="ob-hr-detail-emp-info">
          <div className="ob-hr-detail-avatar">{instance.avatar_initials}</div>
          <div>
            <h3>{instance.full_name}</h3>
            <p>{instance.employee_code} • {instance.designation} • {instance.department}</p>
            <p>Joining: {instance.joining_date} | Stage: <strong>{STAGE_LABELS[instance.current_stage]}</strong> | {instance.overall_completion_pct}% complete</p>
          </div>
        </div>
        <button className="ob-hr-close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="ob-hr-detail-stats">
        <span>✅ {summary.completed} done</span>
        <span>⏳ {summary.pending} pending</span>
        <span>⚠️ {summary.overdue} overdue</span>
        <span>🔴 {summary.action_required} action req.</span>
        <span>📄 {summary.submitted_for_review} in review</span>
      </div>

      <div className="ob-tab-bar" style={{ marginTop: '1rem' }}>
        <button className={`ob-tab-btn ${activeTab === 'tasks' ? 'is-active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <CheckSquare size={14} /> Tasks ({tasks.length})
        </button>
        <button className={`ob-tab-btn ${activeTab === 'documents' ? 'is-active' : ''}`} onClick={() => setActiveTab('documents')}>
          <FileText size={14} /> Documents ({submissions.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="ob-hr-tasks-section">
          {/* HR Task Review Form */}
          <div className="ob-hr-review-form">
            <h4>Review a Task</h4>
            <select className="ob-select" value={reviewTaskId} onChange={e => setReviewTaskId(e.target.value)}>
              <option value="">— Select task —</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.stage}] {t.title} — {STATUS_CONFIG[t.status]?.label || t.status}
                </option>
              ))}
            </select>
            <select className="ob-select" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}>
              <option value="">— New status —</option>
              <option value="COMPLETED">Mark Completed</option>
              <option value="ACTION_REQUIRED">Requires Action</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Reset to Not Started</option>
            </select>
            <textarea
              className="ob-textarea"
              placeholder="Optional HR comments…"
              value={reviewComments}
              onChange={e => setReviewComments(e.target.value)}
              rows={2}
            />
            <button className="ob-btn-primary" onClick={handleTaskReview} disabled={reviewing || !reviewTaskId || !reviewStatus}>
              {reviewing ? <RefreshCw size={14} className="spin" /> : <CheckSquare size={14} />}
              {reviewing ? ' Updating…' : ' Update Task'}
            </button>
            {reviewMsg && <div className={`ob-submit-msg ${reviewMsg.startsWith('✅') ? 'ob-msg-success' : 'ob-msg-error'}`}>{reviewMsg}</div>}
          </div>

          <div className="ob-hr-task-list">
            {tasks.map(task => {
              const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.NOT_STARTED;
              return (
                <div key={task.id} className="ob-hr-task-row">
                  <div className="ob-hr-task-row-status" style={{ color: cfg.color }}>{cfg.label}</div>
                  <div className="ob-hr-task-row-info">
                    <span className="ob-hr-task-row-title">{task.title}</span>
                    <span className="ob-hr-task-row-meta">{STAGE_LABELS[task.stage]} · Due: {task.due_date} · {task.responsible_party}</span>
                    {task.hr_comments && <span className="ob-hr-task-row-comment">HR: {task.hr_comments}</span>}
                  </div>
                  {task.requires_approval && (
                    <span className="ob-task-approval-pill">Approval Req.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="ob-hr-docs-section">
          {/* HR Doc Review Form */}
          <div className="ob-hr-review-form">
            <h4>Review a Document</h4>
            <select className="ob-select" value={docReviewId} onChange={e => setDocReviewId(e.target.value)}>
              <option value="">— Select document —</option>
              {submissions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.doc_type_name} ({s.status})
                </option>
              ))}
            </select>
            <select className="ob-select" value={docReviewStatus} onChange={e => setDocReviewStatus(e.target.value)}>
              <option value="">— Decision —</option>
              <option value="VERIFIED">Verified</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <textarea
              className="ob-textarea"
              placeholder="Review comments for employee…"
              value={docReviewComments}
              onChange={e => setDocReviewComments(e.target.value)}
              rows={2}
            />
            <button className="ob-btn-primary" onClick={handleDocReview} disabled={docReviewing || !docReviewId || !docReviewStatus}>
              {docReviewing ? <RefreshCw size={14} className="spin" /> : <Shield size={14} />}
              {docReviewing ? ' Saving…' : ' Submit Review'}
            </button>
            {docReviewMsg && <div className={`ob-submit-msg ${docReviewMsg.startsWith('✅') ? 'ob-msg-success' : 'ob-msg-error'}`}>{docReviewMsg}</div>}
          </div>

          <div className="ob-hr-doc-list">
            {submissions.length === 0 ? (
              <p className="ob-info-sub">No documents submitted yet.</p>
            ) : submissions.map(s => {
              const cfg = DOC_STATUS_CONFIG[s.status] || { label: s.status, color: '#64748b' };
              return (
                <div key={s.id} className="ob-hr-doc-row">
                  <FileText size={16} style={{ color: s.is_sensitive ? '#f59e0b' : '#0ea5e9' }} />
                  <div className="ob-hr-doc-info">
                    <span className="ob-hr-doc-name">{s.doc_type_name}</span>
                    <span className="ob-hr-doc-file">{s.filename} · {s.file_size_kb}KB</span>
                    {s.review_comments && <span className="ob-hr-doc-comment">Comment: {s.review_comments}</span>}
                    {s.is_sensitive && <span className="ob-hr-doc-restricted">🔒 Restricted Document</span>}
                  </div>
                  <span className="ob-doc-status-badge" style={{ color: cfg.color, borderColor: cfg.color + '33', background: cfg.color + '15' }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assign Onboarding Form ───────────────────────────────────────────

function AssignOnboardingForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    employee_code: '', full_name: '', email: '', department: '', designation: '',
    joining_date: '', manager_code: '', manager_name: '', buddy_code: '', buddy_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async () => {
    if (!form.employee_code || !form.full_name || !form.email || !form.joining_date) {
      setMsg('Employee Code, Full Name, Email, and Joining Date are required.');
      return;
    }
    setSaving(true); setMsg('');
    try {
      await onboardingAPI.hrAssignOnboarding({ ...form });

      // Save new hire persona into localStorage so they can be logged in with 1-click on /login
      try {
        const stored = JSON.parse(localStorage.getItem('dsp_custom_personas') || '[]');
        const updated = [
          ...stored.filter((p: any) => p.code?.toLowerCase() !== form.employee_code.toLowerCase()),
          {
            code: form.employee_code,
            name: form.full_name,
            email: form.email,
            role: 'EMPLOYEE',
            designation: form.designation || 'New Hire',
            department: form.department || 'Equities & Wealth Management',
            password: 'Password@123',
          },
        ];
        localStorage.setItem('dsp_custom_personas', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }

      setMsg(`✅ Onboarding plan assigned! New hire can log in immediately with ID "${form.employee_code}" and Password "Password@123".`);
      onSuccess();
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || 'Failed to assign onboarding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ob-hr-assign-form">
      <h3>Assign Onboarding Plan to New Employee</h3>
      <div className="ob-assign-form-grid">
        {[
          { key: 'employee_code', label: 'Employee Code *', placeholder: 'EMP-2006' },
          { key: 'full_name', label: 'Full Name *', placeholder: 'Full Name' },
          { key: 'email', label: 'Email *', placeholder: 'email@dspamc.com' },
          { key: 'department', label: 'Department', placeholder: 'Department' },
          { key: 'designation', label: 'Designation', placeholder: 'Designation' },
          { key: 'joining_date', label: 'Joining Date *', placeholder: 'YYYY-MM-DD', type: 'date' },
          { key: 'manager_code', label: 'Manager Code', placeholder: 'EMP-XXXX' },
          { key: 'manager_name', label: 'Manager Name', placeholder: 'Manager Name' },
          { key: 'buddy_code', label: 'Buddy Code', placeholder: 'EMP-XXXX' },
          { key: 'buddy_name', label: 'Buddy Name', placeholder: 'Buddy Name' },
        ].map(field => (
          <div key={field.key} className="ob-assign-field">
            <label className="ob-assign-label">{field.label}</label>
            <input
              className="ob-input"
              type={(field as any).type || 'text'}
              placeholder={field.placeholder}
              value={(form as any)[field.key]}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button className="ob-btn-primary" onClick={handleSubmit} disabled={saving}>
        <Plus size={14} /> {saving ? 'Assigning…' : 'Assign Onboarding Plan'}
      </button>
      {msg && <div className={`ob-submit-msg ${msg.startsWith('✅') ? 'ob-msg-success' : 'ob-msg-error'}`}>{msg}</div>}
      <p className="ob-assign-note">
        Template: Standard Employee Onboarding — DSPAMC (Synthetic Demo Template).
        This action creates a full task set from the template and notifies the employee.
      </p>
    </div>
  );
}

// ─── Manager / IT Panel ───────────────────────────────────────────────

function ManagerITPanel({ role }: { role: 'manager' | 'it' }) {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = role === 'manager' ? await onboardingAPI.managerGetTasks() : await onboardingAPI.itGetTasks();
        if (res.data?.success) setTasks(res.data.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  const handleUpdate = async (task: OnboardingTask, newStatus: string) => {
    setUpdating(task.id);
    setUpdateMsg('');
    try {
      const fn = role === 'it' ? onboardingAPI.itUpdateTask : onboardingAPI.hrReviewTask;
      await fn({ task_id: task.id, employee_code: task.employee_code, new_status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t));
      setUpdateMsg('✅ Task updated.');
    } catch (err: any) {
      setUpdateMsg(err?.response?.data?.detail || 'Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="ob-loading-spinner" style={{ margin: '2rem auto' }} />;

  return (
    <div>
      {updateMsg && <div className={`ob-submit-msg ${updateMsg.startsWith('✅') ? 'ob-msg-success' : 'ob-msg-error'}`} style={{ marginBottom: '1rem' }}>{updateMsg}</div>}
      {tasks.length === 0 ? (
        <div className="ob-empty-state">
          <CheckCircle2 size={36} style={{ color: '#10b981' }} />
          <p>No tasks assigned to you currently.</p>
        </div>
      ) : (
        tasks.map(task => {
          const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.NOT_STARTED;
          return (
            <div key={task.id} className="ob-hr-task-row" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
              <div className="ob-hr-task-row-status" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="ob-hr-task-row-info">
                <span className="ob-hr-task-row-title">{task.title}</span>
                {task.employee_name && <span className="ob-hr-task-row-meta">Employee: {task.employee_name}</span>}
                <span className="ob-hr-task-row-meta">{STAGE_LABELS[task.stage]} · Due: {task.due_date}</span>
                {task.hr_comments && <span className="ob-hr-task-row-comment">Note: {task.hr_comments}</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {task.status !== 'COMPLETED' && (
                  <button
                    className="ob-btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    disabled={updating === task.id}
                    onClick={() => handleUpdate(task, 'COMPLETED')}
                  >
                    {updating === task.id ? '…' : 'Mark Done'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Main HR Workspace ────────────────────────────────────────────────

export default function OnboardingHR() {
  const { user } = useAppStore();
  const [employees, setEmployees] = useState<OnboardingInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<OnboardingInstance | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'assign' | 'manager' | 'it' | 'audit'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [auditLog, setAuditLog] = useState<any[]>([]);

  const isHRorAdmin = ['ADMIN', 'MANAGER', 'COMPLIANCE'].includes((user?.role || '').toUpperCase());

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onboardingAPI.hrGetAllEmployees(stageFilter || undefined);
      if (res.data?.success) setEmployees(res.data.data?.employees || []);
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  const loadAudit = useCallback(async () => {
    try {
      const res = await onboardingAPI.hrGetAuditLog(50);
      if (res.data?.success) setAuditLog(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { if (activeTab === 'audit') loadAudit(); }, [activeTab, loadAudit]);

  if (!isHRorAdmin) {
    return (
      <div className="ob-no-onboarding-screen">
        <div className="ob-no-onboarding-card">
          <Shield size={48} style={{ color: '#ef4444' }} />
          <h2>Access Restricted</h2>
          <p>The HR Onboarding Workspace requires Manager or Admin permissions.</p>
        </div>
      </div>
    );
  }

  const filtered = employees.filter(e =>
    (!searchTerm || e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetail = (emp: OnboardingInstance) => {
    setSelectedEmp(emp);
    setActiveTab('detail');
  };

  // Stats from employees
  const totalEmployees = employees.length;
  const completedCount = employees.filter(e => e.current_stage === 'COMPLETED').length;
  const inProgressCount = employees.filter(e => e.current_stage !== 'COMPLETED' && e.overall_completion_pct > 0).length;
  const notStartedCount = employees.filter(e => e.overall_completion_pct === 0).length;

  return (
    <div className="ob-page-root">
      <div className="ob-demo-banner">
        <AlertTriangle size={14} />
        <span>
          <strong>SYNTHETIC DEMONSTRATION DATA</strong> — All employee records and onboarding data shown are fictional.
          HR administrators must configure actual onboarding requirements for production use.
        </span>
      </div>

      {/* Header */}
      <div className="ob-hr-workspace-header">
        <div>
          <h1 className="ob-hr-workspace-title">
            <Shield size={22} style={{ color: '#0ea5e9' }} /> HR Onboarding Workspace
          </h1>
          <p className="ob-hr-workspace-sub">
            Manage employee onboarding plans, review documents, and track progress.
          </p>
        </div>
        <button className="ob-btn-primary" onClick={() => setActiveTab('assign')}>
          <Plus size={14} /> Assign New Onboarding
        </button>
      </div>

      {/* Stats */}
      <div className="ob-quick-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="ob-stat-card"><Users size={20} style={{ color: '#0ea5e9' }} /><span className="ob-stat-num">{totalEmployees}</span><span className="ob-stat-label">Total</span></div>
        <div className="ob-stat-card"><CheckCircle2 size={20} style={{ color: '#10b981' }} /><span className="ob-stat-num">{completedCount}</span><span className="ob-stat-label">Completed</span></div>
        <div className="ob-stat-card"><Clock size={20} style={{ color: '#0ea5e9' }} /><span className="ob-stat-num">{inProgressCount}</span><span className="ob-stat-label">In Progress</span></div>
        <div className="ob-stat-card"><AlertCircle size={20} style={{ color: '#94a3b8' }} /><span className="ob-stat-num">{notStartedCount}</span><span className="ob-stat-label">Not Started</span></div>
      </div>

      {/* Tab Bar */}
      <div className="ob-tab-bar">
        {[
          { id: 'overview', label: 'All Employees', icon: <Users size={14} /> },
          { id: 'detail', label: 'Employee Detail', icon: <Eye size={14} />, disabled: !selectedEmp },
          { id: 'assign', label: 'Assign Onboarding', icon: <Plus size={14} /> },
          { id: 'manager', label: 'Manager Tasks', icon: <UserCheck size={14} /> },
          { id: 'it', label: 'IT Tasks', icon: <Laptop2 size={14} /> },
          { id: 'audit', label: 'Audit Log', icon: <Shield size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`ob-tab-btn ${activeTab === tab.id ? 'is-active' : ''} ${tab.disabled ? 'ob-tab-disabled' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
          >
            {tab.icon}&nbsp;{tab.label}
          </button>
        ))}
      </div>

      <div className="ob-tab-content">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <div className="ob-hr-filters">
              <div className="ob-search-wrap">
                <Search size={15} style={{ color: '#64748b' }} />
                <input
                  className="ob-input"
                  placeholder="Search by name, code, or department…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="ob-select" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                <option value="">All Stages</option>
                {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="ob-loading-spinner" style={{ margin: '3rem auto' }} />
            ) : filtered.length === 0 ? (
              <div className="ob-empty-state">
                <Users size={36} style={{ color: '#64748b' }} />
                <p>No employees found.</p>
              </div>
            ) : (
              filtered.map(emp => (
                <EmployeeRow key={emp.employee_code} instance={emp} onViewDetail={handleViewDetail} />
              ))
            )}
          </div>
        )}

        {/* ── Detail Tab ─────────────────────────────────────────── */}
        {activeTab === 'detail' && selectedEmp && (
          <EmployeeDetailPanel
            empCode={selectedEmp.employee_code}
            onClose={() => { setSelectedEmp(null); setActiveTab('overview'); }}
          />
        )}

        {/* ── Assign Tab ─────────────────────────────────────────── */}
        {activeTab === 'assign' && (
          <AssignOnboardingForm onSuccess={() => { loadEmployees(); setActiveTab('overview'); }} />
        )}

        {/* ── Manager Tasks Tab ─────────────────────────────────── */}
        {activeTab === 'manager' && (
          <div>
            <h3 className="ob-section-title">Manager-Assigned Onboarding Tasks</h3>
            <p className="ob-section-sub">Tasks where you (the reporting manager) are the responsible party.</p>
            <ManagerITPanel role="manager" />
          </div>
        )}

        {/* ── IT Tasks Tab ──────────────────────────────────────── */}
        {activeTab === 'it' && (
          <div>
            <h3 className="ob-section-title">IT Support Onboarding Tasks</h3>
            <p className="ob-section-sub">Equipment, account provisioning, and system access tasks for new joiners.</p>
            <ManagerITPanel role="it" />
          </div>
        )}

        {/* ── Audit Log Tab ─────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div>
            <h3 className="ob-section-title">Onboarding Audit Log</h3>
            {auditLog.length === 0 ? (
              <p className="ob-info-sub">No audit entries yet.</p>
            ) : auditLog.map(entry => (
              <div key={entry.id} className="ob-hr-audit-row">
                <span className="ob-hr-audit-action">{entry.action}</span>
                <span className="ob-hr-audit-emp">Emp: {entry.employee_code}</span>
                <span className="ob-hr-audit-actor">By: {entry.actor_code}</span>
                <span className="ob-hr-audit-time">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
