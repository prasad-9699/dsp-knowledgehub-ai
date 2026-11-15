import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, AlertTriangle, ChevronRight, ChevronDown, ChevronUp,
  Upload, FileText, Bell, BellOff, User, Building2, Calendar, UserCheck,
  Sparkles, Send, RefreshCw, Shield, Star, Target, BookOpen, Laptop2,
  ArrowRight, X, CheckSquare, RotateCcw, Info
} from 'lucide-react';
import { onboardingAPI } from '../services/api';
import type {
  OnboardingStatus, OnboardingTask, OnboardingTaskSummary,
  DocumentSubmission, DocumentType, OnboardingNotification, OnboardingInstance
} from '../services/api';
import { useAppStore } from '../store/useAppStore';

// ─── Constants ───────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  PREBOARDING: 'Preboarding',
  DAY_1: 'Day 1',
  FIRST_WEEK: 'First Week',
  FIRST_30_DAYS: 'First 30 Days',
  COMPLETED: 'Onboarding Complete',
};

const STAGE_ORDER = ['PREBOARDING', 'DAY_1', 'FIRST_WEEK', 'FIRST_30_DAYS', 'COMPLETED'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NOT_STARTED: { label: 'Not Started', color: '#94a3b8', icon: <Clock size={14} /> },
  IN_PROGRESS: { label: 'In Progress', color: '#0ea5e9', icon: <RotateCcw size={14} /> },
  SUBMITTED_FOR_REVIEW: { label: 'Submitted', color: '#8b5cf6', icon: <Send size={14} /> },
  COMPLETED: { label: 'Completed', color: '#10b981', icon: <CheckCircle2 size={14} /> },
  ACTION_REQUIRED: { label: 'Action Required', color: '#f59e0b', icon: <AlertCircle size={14} /> },
  OVERDUE: { label: 'Overdue', color: '#ef4444', icon: <AlertTriangle size={14} /> },
};

const PARTY_LABELS: Record<string, string> = {
  EMPLOYEE: 'You',
  HR: 'HR Team',
  MANAGER: 'Your Manager',
  IT: 'IT Support',
};

// ─── Sub-components ───────────────────────────────────────────────────

function TaskCard({ task, onStatusUpdate }: { task: OnboardingTask; onStatusUpdate: (id: string, status: string, comments?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState('');
  const [updating, setUpdating] = useState(false);

  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.NOT_STARTED;
  const isEmployee = task.responsible_party === 'EMPLOYEE';
  const canUpdate = isEmployee && task.status !== 'COMPLETED';

  const handleUpdate = async () => {
    if (!selectedStatus) return;
    setUpdating(true);
    try {
      await onStatusUpdate(task.id, selectedStatus, comments || undefined);
      setShowUpdate(false);
      setComments('');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`ob-task-card ${task.status === 'OVERDUE' ? 'ob-task-overdue' : ''} ${task.status === 'COMPLETED' ? 'ob-task-completed' : ''}`}>
      <div className="ob-task-header" onClick={() => setExpanded(e => !e)}>
        <div className="ob-task-status-dot" style={{ background: cfg.color }} />
        <div className="ob-task-title-block">
          <span className="ob-task-title">{task.title}</span>
          <div className="ob-task-meta">
            <span className="ob-task-due">Due: {task.due_date}</span>
            <span className="ob-task-party">• {PARTY_LABELS[task.responsible_party] || task.responsible_party}</span>
            {task.is_required && <span className="ob-task-required-pill">Required</span>}
            {task.requires_approval && <span className="ob-task-approval-pill">Needs Approval</span>}
          </div>
        </div>
        <span className="ob-task-status-badge" style={{ color: cfg.color, borderColor: cfg.color + '33', background: cfg.color + '15' }}>
          {cfg.icon}&nbsp;{cfg.label}
        </span>
        {expanded ? <ChevronUp size={16} className="ob-task-chevron" /> : <ChevronDown size={16} className="ob-task-chevron" />}
      </div>

      {expanded && (
        <div className="ob-task-body">
          <p className="ob-task-description">{task.description}</p>

          {task.hr_comments && (
            <div className="ob-task-hr-note">
              <Shield size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span><strong>HR note:</strong> {task.hr_comments}</span>
            </div>
          )}
          {task.employee_comments && (
            <div className="ob-task-emp-note">
              <User size={13} style={{ color: '#0ea5e9', flexShrink: 0 }} />
              <span><strong>Your note:</strong> {task.employee_comments}</span>
            </div>
          )}
          {task.completed_at && (
            <div className="ob-task-completed-line">
              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
              Completed: {new Date(task.completed_at).toLocaleDateString()}
            </div>
          )}

          {canUpdate && !showUpdate && (
            <button className="ob-task-update-btn" onClick={(e) => { e.stopPropagation(); setShowUpdate(true); }}>
              Update Status
            </button>
          )}

          {showUpdate && (
            <div className="ob-task-update-panel" onClick={e => e.stopPropagation()}>
              <select
                className="ob-select"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="">— Select new status —</option>
                <option value="IN_PROGRESS">Mark In Progress</option>
                <option value="SUBMITTED_FOR_REVIEW">Submit for Review</option>
                {!task.requires_approval && <option value="COMPLETED">Mark Complete</option>}
                <option value="NOT_STARTED">Reset to Not Started</option>
              </select>
              <textarea
                className="ob-textarea"
                placeholder="Optional comments or notes..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={2}
              />
              <div className="ob-task-update-actions">
                <button className="ob-btn-ghost" onClick={() => { setShowUpdate(false); setComments(''); }}>Cancel</button>
                <button className="ob-btn-primary" onClick={handleUpdate} disabled={!selectedStatus || updating}>
                  {updating ? 'Saving…' : 'Save Update'}
                </button>
              </div>
              {task.requires_approval && (
                <p className="ob-approval-note">
                  <Shield size={12} /> This task requires HR/manager approval to be marked complete.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ submission, docTypes }: { submission: DocumentSubmission; docTypes: DocumentType[] }) {
  const statusColors: Record<string, string> = {
    SUBMITTED: '#8b5cf6',
    VERIFIED: '#10b981',
    CORRECTION_REQUIRED: '#f59e0b',
    REJECTED: '#ef4444',
  };
  const color = statusColors[submission.status] || '#94a3b8';

  return (
    <div className="ob-doc-card">
      <div className="ob-doc-icon">
        <FileText size={18} style={{ color: submission.is_sensitive ? '#f59e0b' : '#0ea5e9' }} />
      </div>
      <div className="ob-doc-info">
        <span className="ob-doc-name">{submission.doc_type_name}</span>
        <span className="ob-doc-filename">{submission.filename} — {submission.file_size_kb}KB</span>
        {submission.review_comments && (
          <span className="ob-doc-comments">{submission.review_comments}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <span className="ob-doc-status-badge" style={{ color, borderColor: color + '33', background: color + '15' }}>
          {submission.status.replace('_', ' ')}
        </span>
        {submission.is_sensitive && (
          <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>🔒 Restricted</span>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notif, onRead }: { notif: OnboardingNotification; onRead: (id: string) => void }) {
  const iconMap: Record<string, React.ReactNode> = {
    TASK_ASSIGNED: <Target size={15} style={{ color: '#0ea5e9' }} />,
    TASK_DEADLINE: <Clock size={15} style={{ color: '#f59e0b' }} />,
    TASK_ACTION_REQUIRED: <AlertCircle size={15} style={{ color: '#f59e0b' }} />,
    DOCUMENT_CORRECTION: <AlertTriangle size={15} style={{ color: '#f59e0b' }} />,
    DOCUMENT_VERIFIED: <CheckCircle2 size={15} style={{ color: '#10b981' }} />,
    DOCUMENT_REJECTED: <X size={15} style={{ color: '#ef4444' }} />,
    ONBOARDING_COMPLETED: <Star size={15} style={{ color: '#10b981' }} />,
  };

  return (
    <div className={`ob-notif-item ${notif.is_read ? 'ob-notif-read' : 'ob-notif-unread'}`}>
      <div className="ob-notif-icon">{iconMap[notif.type] || <Bell size={15} />}</div>
      <div className="ob-notif-body">
        <span className="ob-notif-title">{notif.title}</span>
        <span className="ob-notif-message">{notif.message}</span>
        <span className="ob-notif-time">{new Date(notif.created_at).toLocaleString()}</span>
      </div>
      {!notif.is_read && (
        <button className="ob-notif-read-btn" onClick={() => onRead(notif.id)}>Mark read</button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [notifications, setNotifications] = useState<OnboardingNotification[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'documents' | 'notifications' | 'assistant'>('dashboard');
  const [activeStage, setActiveStage] = useState<string>('ALL');

  // Document submit state
  const [submitDocTypeId, setSubmitDocTypeId] = useState('');
  const [submitFilename, setSubmitFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // AI assistant
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async (previewCode?: string) => {
    try {
      setLoading(true);
      const [statusRes, notifsRes] = await Promise.all([
        onboardingAPI.getMyStatus(previewCode),
        onboardingAPI.getNotifications(),
      ]);
      if (statusRes.data?.success) setStatus(statusRes.data.data);
      if (notifsRes.data?.success) setNotifications(notifsRes.data.data || []);

      // Load doc types
      if (statusRes.data?.data?.has_active_onboarding) {
        const docsRes = await onboardingAPI.getMyDocuments();
        if (docsRes.data?.success) setDocTypes(docsRes.data.data?.document_types || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTaskUpdate = async (taskId: string, newStatus: string, comments?: string) => {
    try {
      await onboardingAPI.updateTaskStatus({ task_id: taskId, new_status: newStatus, comments });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update task.');
    }
  };

  const handleDocSubmit = async () => {
    if (!submitDocTypeId || !submitFilename.trim()) {
      setSubmitMsg('Please select a document type and enter the filename.');
      return;
    }
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await onboardingAPI.submitDocument({ doc_type_id: submitDocTypeId, filename: submitFilename.trim(), file_size_kb: 256 });
      setSubmitMsg('✅ Document submitted for HR review.');
      setSubmitDocTypeId('');
      setSubmitFilename('');
      await load();
    } catch (err: any) {
      setSubmitMsg(err?.response?.data?.detail || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifRead = async (notifId: string) => {
    await onboardingAPI.markNotificationRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const handleAiQuery = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await onboardingAPI.queryAssistant(aiQuestion);
      if (res.data?.success) setAiAnswer(res.data.data);
    } catch (err: any) {
      setAiAnswer({ answer: 'Unable to retrieve onboarding data at this time.', citations: [] });
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ob-loading-screen">
        <div className="ob-loading-spinner" />
        <p>Loading your onboarding portal…</p>
      </div>
    );
  }

  // ─── No Active Onboarding ─────────────────────────────────────────

  if (!status?.has_active_onboarding) {
    return (
      <div className="ob-no-onboarding-screen">
        <div className="ob-no-onboarding-card">
          <div className="ob-no-onboarding-icon"><CheckSquare size={48} style={{ color: '#10b981' }} /></div>
          <h2>No Active Onboarding Plan</h2>
          <p>
            {status?.message ||
              "You don't have an active onboarding plan. If you believe this is an error, please contact your HR coordinator."}
          </p>
          <div className="ob-no-onboarding-hint">
            <Info size={14} /> Existing employees continue to use the regular employee self-service portal.
          </div>

          <div style={{ marginTop: '1.25rem', width: '100%', textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
              Preview Interactive Candidate Onboarding Flows (Demo Mode):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { code: 'EMP-2001', name: 'Kavya Reddy', stage: 'Preboarding' },
                { code: 'EMP-2002', name: 'Arjun Pillai', stage: 'Day 1' },
                { code: 'EMP-2003', name: 'Meera Kapoor', stage: 'First Week' },
                { code: 'EMP-2004', name: 'Rahul Singh', stage: 'First 30 Days' },
                { code: 'EMP-2005', name: 'Sneha Joshi', stage: 'Completed' },
              ].map((p) => (
                <button
                  key={p.code}
                  type="button"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    color: '#1e293b',
                  }}
                  onClick={() => load(p.code)}
                >
                  <strong>{p.name}</strong> ({p.code}) — {p.stage}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button className="ob-btn-primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const instance = status.instance!;
  const allTasks = status.all_tasks || [];
  const taskSummary = status.task_summary!;
  const submissions = status.document_submissions || [];
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const currentStageIdx = STAGE_ORDER.indexOf(instance.current_stage);
  const filteredTasks = activeStage === 'ALL' ? allTasks : allTasks.filter(t => t.stage === activeStage);

  return (
    <div className="ob-page-root">
      {/* ─── DEMO BANNER ──────────────────────────────────────────── */}
      <div className="ob-demo-banner">
        <AlertTriangle size={14} />
        <span>
          <strong>SYNTHETIC DEMONSTRATION DATA</strong> — All employees, tasks, and documents shown are fictional.
          This is not an official DSPAMC onboarding record.
        </span>
      </div>

      {/* ─── HERO WELCOME HEADER ──────────────────────────────────── */}
      <div className="ob-hero-header">
        <div className="ob-hero-avatar">{instance.avatar_initials}</div>
        <div className="ob-hero-info">
          <div className="ob-hero-badges">
            <span className="ob-emp-code-pill">{instance.employee_code}</span>
            <span className="ob-dept-pill">{instance.department}</span>
            <span className="ob-stage-pill">{STAGE_LABELS[instance.current_stage] || instance.current_stage}</span>
          </div>
          <h1 className="ob-hero-name">Welcome, {instance.full_name}</h1>
          <div className="ob-hero-details">
            <span><User size={13} /> {instance.designation}</span>
            <span><Building2 size={13} /> Reports to: {instance.manager_name || 'Not assigned'}</span>
            <span><Calendar size={13} /> Joining: {instance.joining_date}</span>
            {instance.buddy_name && (
              <span><UserCheck size={13} /> Buddy: {instance.buddy_name}</span>
            )}
          </div>
        </div>

        <div className="ob-hero-progress-ring">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
            <circle
              cx="45" cy="45" r="38"
              fill="none"
              stroke={instance.overall_completion_pct === 100 ? '#10b981' : '#0ea5e9'}
              strokeWidth="7"
              strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - instance.overall_completion_pct / 100)}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '45px 45px', transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="45" y="45" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="16" fontWeight="700">
              {instance.overall_completion_pct}%
            </text>
          </svg>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '0.25rem' }}>
            Complete
          </div>
        </div>
      </div>

      {/* ─── QUICK STATS ─────────────────────────────────────────── */}
      <div className="ob-quick-stats">
        <div className="ob-stat-card">
          <CheckCircle2 size={20} style={{ color: '#10b981' }} />
          <span className="ob-stat-num">{taskSummary.completed}</span>
          <span className="ob-stat-label">Completed</span>
        </div>
        <div className="ob-stat-card">
          <Clock size={20} style={{ color: '#0ea5e9' }} />
          <span className="ob-stat-num">{taskSummary.pending}</span>
          <span className="ob-stat-label">Pending</span>
        </div>
        <div className="ob-stat-card">
          <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          <span className="ob-stat-num">{taskSummary.overdue}</span>
          <span className="ob-stat-label">Overdue</span>
        </div>
        <div className="ob-stat-card">
          <AlertCircle size={20} style={{ color: '#f59e0b' }} />
          <span className="ob-stat-num">{taskSummary.action_required}</span>
          <span className="ob-stat-label">Action Req.</span>
        </div>
        <div className="ob-stat-card">
          <Send size={20} style={{ color: '#8b5cf6' }} />
          <span className="ob-stat-num">{taskSummary.submitted_for_review}</span>
          <span className="ob-stat-label">In Review</span>
        </div>
        <div className="ob-stat-card ob-stat-bell" onClick={() => setActiveTab('notifications')}>
          <Bell size={20} style={{ color: unreadNotifs > 0 ? '#f59e0b' : '#94a3b8' }} />
          <span className="ob-stat-num">{unreadNotifs}</span>
          <span className="ob-stat-label">Alerts</span>
        </div>
      </div>

      {/* ─── ONBOARDING TIMELINE ─────────────────────────────────── */}
      <div className="ob-timeline-section">
        <div className="ob-timeline-track">
          {STAGE_ORDER.filter(s => s !== 'COMPLETED').map((stage, idx) => {
            const stageIdx = STAGE_ORDER.indexOf(stage);
            const isActive = stage === instance.current_stage;
            const isDone = stageIdx < currentStageIdx;
            const stageTasks = allTasks.filter(t => t.stage === stage);
            const stageDone = stageTasks.filter(t => t.status === 'COMPLETED').length;
            const stageTotal = stageTasks.length;

            return (
              <React.Fragment key={stage}>
                <div
                  className={`ob-timeline-node ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
                  onClick={() => { setActiveTab('tasks'); setActiveStage(stage); }}
                  title={STAGE_LABELS[stage]}
                >
                  <div className="ob-timeline-bubble">
                    {isDone ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="ob-timeline-label">{STAGE_LABELS[stage]}</span>
                  {stageTotal > 0 && (
                    <span className="ob-timeline-progress">{stageDone}/{stageTotal}</span>
                  )}
                </div>
                {idx < STAGE_ORDER.length - 2 && (
                  <div className={`ob-timeline-connector ${isDone ? 'is-done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── TAB BAR ─────────────────────────────────────────────── */}
      <div className="ob-tab-bar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <Target size={15} /> },
          { id: 'tasks', label: `Tasks (${taskSummary.total})`, icon: <CheckSquare size={15} /> },
          { id: 'documents', label: `Documents (${submissions.length})`, icon: <FileText size={15} /> },
          { id: 'notifications', label: `Alerts${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}`, icon: <Bell size={15} /> },
          { id: 'assistant', label: 'AI Assistant', icon: <Sparkles size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`ob-tab-btn ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon}&nbsp;{tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENT ─────────────────────────────────────────── */}
      <div className="ob-tab-content">

        {/* ── DASHBOARD TAB ─────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="ob-dashboard-grid">
            <div className="ob-dashboard-main">
              <h3 className="ob-section-title">Upcoming Tasks</h3>
              {allTasks.filter(t => t.status !== 'COMPLETED').slice(0, 6).map(task => (
                <TaskCard key={task.id} task={task} onStatusUpdate={handleTaskUpdate} />
              ))}
              {allTasks.filter(t => t.status !== 'COMPLETED').length === 0 && (
                <div className="ob-empty-state">
                  <CheckCircle2 size={40} style={{ color: '#10b981' }} />
                  <p>All tasks completed! 🎉</p>
                </div>
              )}
            </div>

            <div className="ob-dashboard-sidebar">
              {/* HR Coordinator */}
              <div className="ob-info-card">
                <h4 className="ob-card-title"><UserCheck size={15} /> HR Coordinator</h4>
                <p className="ob-info-val">{instance.hr_coordinator_name}</p>
                <p className="ob-info-sub">Your HR contact for onboarding queries</p>
              </div>

              {/* Recent Notifications */}
              <div className="ob-info-card">
                <h4 className="ob-card-title"><Bell size={15} /> Recent Alerts</h4>
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="ob-sidebar-notif">
                    <span className={`ob-sidebar-notif-dot ${n.is_read ? '' : 'is-unread'}`} />
                    <span className="ob-sidebar-notif-title">{n.title}</span>
                  </div>
                ))}
                {notifications.length === 0 && <p className="ob-info-sub">No notifications</p>}
                <button className="ob-link-btn" onClick={() => setActiveTab('notifications')}>
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {/* Document Status */}
              <div className="ob-info-card">
                <h4 className="ob-card-title"><FileText size={15} /> Document Status</h4>
                {submissions.slice(0, 3).map(s => (
                  <div key={s.id} className="ob-sidebar-doc">
                    <span className="ob-sidebar-doc-name">{s.doc_type_name}</span>
                    <span className="ob-sidebar-doc-status" data-status={s.status}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {submissions.length === 0 && <p className="ob-info-sub">No documents submitted yet</p>}
                <button className="ob-link-btn" onClick={() => setActiveTab('documents')}>
                  Manage documents <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS TAB ─────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div>
            <div className="ob-stage-filter-bar">
              {['ALL', ...STAGE_ORDER].filter(s => s !== 'COMPLETED' || activeStage === 'COMPLETED').map(stage => (
                <button
                  key={stage}
                  className={`ob-stage-filter-btn ${activeStage === stage ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(stage)}
                >
                  {stage === 'ALL' ? 'All Stages' : STAGE_LABELS[stage] || stage}
                </button>
              ))}
            </div>

            <div className="ob-tasks-list">
              {filteredTasks.length === 0 ? (
                <div className="ob-empty-state">
                  <CheckSquare size={36} style={{ color: '#10b981' }} />
                  <p>No tasks found for this filter.</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} onStatusUpdate={handleTaskUpdate} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ─────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div>
            <div className="ob-doc-upload-section">
              <h3 className="ob-section-title">Submit a Document</h3>
              <p className="ob-section-sub">
                Select the document type and enter the filename of the file you are submitting.
                Sensitive documents are restricted to authorized HR personnel only.
              </p>

              <div className="ob-doc-submit-form">
                <select className="ob-select" value={submitDocTypeId} onChange={e => setSubmitDocTypeId(e.target.value)}>
                  <option value="">— Select document type —</option>
                  {docTypes.map(dt => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}{dt.is_sensitive ? ' 🔒' : ''}
                    </option>
                  ))}
                </select>
                <input
                  className="ob-input"
                  placeholder="Filename (e.g., degree_certificate.pdf)"
                  value={submitFilename}
                  onChange={e => setSubmitFilename(e.target.value)}
                />
                <button className="ob-btn-primary" onClick={handleDocSubmit} disabled={submitting}>
                  <Upload size={14} /> {submitting ? 'Submitting…' : 'Submit Document'}
                </button>
                {submitMsg && (
                  <div className={`ob-submit-msg ${submitMsg.startsWith('✅') ? 'ob-msg-success' : 'ob-msg-error'}`}>
                    {submitMsg}
                  </div>
                )}
              </div>
            </div>

            <h3 className="ob-section-title" style={{ marginTop: '2rem' }}>Your Submitted Documents</h3>
            {submissions.length === 0 ? (
              <div className="ob-empty-state">
                <FileText size={36} style={{ color: '#64748b' }} />
                <p>No documents submitted yet.</p>
              </div>
            ) : (
              submissions.map(s => (
                <DocumentCard key={s.id} submission={s} docTypes={docTypes} />
              ))
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ─────────────────────────────────── */}
        {activeTab === 'notifications' && (
          <div>
            <h3 className="ob-section-title">Onboarding Alerts &amp; Notifications</h3>
            {notifications.length === 0 ? (
              <div className="ob-empty-state">
                <BellOff size={36} style={{ color: '#64748b' }} />
                <p>No notifications.</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notif={n} onRead={handleNotifRead} />
              ))
            )}
          </div>
        )}

        {/* ── AI ASSISTANT TAB ──────────────────────────────────── */}
        {activeTab === 'assistant' && (
          <div className="ob-ai-section">
            <div className="ob-ai-header">
              <Sparkles size={24} style={{ color: '#0ea5e9' }} />
              <div>
                <h3>Onboarding AI Assistant</h3>
                <p>Ask questions about your onboarding tasks, documents, or progress. Answers are grounded in your actual onboarding record.</p>
              </div>
            </div>

            <div className="ob-ai-suggestions">
              {[
                'What tasks are still pending?',
                'Which document needs correction?',
                'What should I do before joining?',
                'How is my onboarding going?',
                'What IT access issues do I have?',
              ].map(q => (
                <button key={q} className="ob-ai-suggestion-chip" onClick={() => setAiQuestion(q)}>
                  {q}
                </button>
              ))}
            </div>

            <div className="ob-ai-input-row">
              <textarea
                className="ob-ai-input"
                placeholder="Ask about your onboarding tasks, documents, or progress…"
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiQuery(); } }}
              />
              <button className="ob-ai-send-btn" onClick={handleAiQuery} disabled={aiLoading || !aiQuestion.trim()}>
                {aiLoading ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
              </button>
            </div>

            {aiAnswer && (
              <div className="ob-ai-answer">
                <div className="ob-ai-answer-badge"><Sparkles size={13} /> AI Response</div>
                <div className="ob-ai-answer-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {aiAnswer.answer}
                </div>
                {aiAnswer.citations?.length > 0 && (
                  <div className="ob-ai-citations">
                    {aiAnswer.citations.map((c: any, i: number) => (
                      <div key={i} className="ob-ai-citation-item">
                        <BookOpen size={12} /> {c.document_title} — {c.section}
                      </div>
                    ))}
                  </div>
                )}
                <div className="ob-ai-disclaimer">
                  <Shield size={12} /> Responses are grounded in your actual onboarding record. Completion states are not fabricated.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
