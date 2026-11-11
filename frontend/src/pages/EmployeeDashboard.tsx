import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  ShieldCheck,
  Building,
  Plus,
  ChevronRight,
  TrendingUp,
  FileText,
  GraduationCap
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';
import type { EmployeeDashboardData } from '../services/api';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await selfServiceAPI.getDashboard();
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load employee dashboard', err);
      setError('Unable to load employee dashboard records. Using offline development cache.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading your personalized employee portal...</p>
      </div>
    );
  }

  const emp = data?.employee;
  const leaveSummary = data?.leave_summary;
  const expenseSummary = data?.expense_summary;

  return (
    <div className="dashboard-page-container">
      {/* ─── 1. PERSONALIZED WELCOME & EMPLOYEE CARD ────────────────── */}
      <div className="dashboard-hero-banner">
        <div className="employee-id-card">
          <div className="employee-avatar-wrapper">
            <div className="employee-avatar-large">
              {emp?.avatar_initials || 'AS'}
            </div>
            <div className="employee-status-dot" title="Active DSPAMC Employee" />
          </div>

          <div className="employee-meta-info">
            <div className="employee-badge-row">
              <span className="employee-code-pill">{emp?.employee_code || 'EMP-1001'}</span>
              <span className="employee-dept-pill">{emp?.department || 'Equities & Wealth Management'}</span>
              <span className="demo-notice-tag">SYNTHETIC DEMO RECORD</span>
            </div>

            <h1 className="employee-welcome-name">
              Welcome back, {emp?.full_name || 'Aditi Sharma'}
            </h1>

            <div className="employee-details-row">
              <span className="detail-item">
                <User style={{ width: 13, height: 13 }} />
                {emp?.designation || 'Senior Investment Analyst'}
              </span>
              <span className="detail-divider">•</span>
              <span className="detail-item">
                <Building style={{ width: 13, height: 13 }} />
                Reports to: {emp?.manager_name || 'Vikram Malhotra'}
              </span>
              <span className="detail-divider">•</span>
              <span className="detail-item">
                <MapPin style={{ width: 13, height: 13 }} />
                {emp?.location || 'Mumbai - Nariman Point'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Assistant CTA */}
        <div className="dashboard-assistant-cta" onClick={() => navigate('/assistant')}>
          <div className="cta-icon">
            <Sparkles style={{ width: 20, height: 20, color: '#12B8A6' }} />
          </div>
          <div className="cta-content">
            <span className="cta-title">Ask AI Knowledge Assistant</span>
            <span className="cta-subtitle">Check leave, policies, or reimbursement SLAs</span>
          </div>
          <ChevronRight style={{ width: 16, height: 16, color: '#94A3B8' }} />
        </div>
      </div>

      {/* ─── 2. CORE METRICS GRID ───────────────────────────────────── */}
      <div className="dashboard-metrics-grid">
        {/* Card 1: Leave Balance */}
        <div className="metric-card leave-metric-card" onClick={() => navigate('/leave')}>
          <div className="metric-header">
            <div className="metric-icon-box bg-teal-subtle">
              <Calendar style={{ width: 18, height: 18, color: '#0D9488' }} />
            </div>
            <span className="metric-badge">LEAVE BALANCE</span>
          </div>

          <div className="metric-body">
            <div className="metric-big-number">
              {leaveSummary?.total_available ?? 23} <span className="metric-unit">days left</span>
            </div>
            <p className="metric-subtext">
              Across Privilege Leave (PL) &amp; Casual Leave (CSL)
            </p>

            {/* Micro Category Breakdown */}
            <div className="leave-micro-bars">
              {leaveSummary?.categories?.slice(0, 3).map((c) => (
                <div key={c.code} className="micro-bar-item">
                  <div className="bar-label">
                    <span>{c.code}</span>
                    <span className="bar-val">{c.available}/{c.allocated}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.min(100, (c.available / c.allocated) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-footer">
            <span>Apply for leave</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </div>

        {/* Card 2: Reimbursements */}
        <div className="metric-card expense-metric-card" onClick={() => navigate('/reimbursements')}>
          <div className="metric-header">
            <div className="metric-icon-box bg-blue-subtle">
              <CreditCard style={{ width: 18, height: 18, color: '#0284C7' }} />
            </div>
            <span className="metric-badge">REIMBURSEMENTS</span>
          </div>

          <div className="metric-body">
            <div className="metric-big-number">
              ₹{(expenseSummary?.pending_approval_amount ?? 4850).toLocaleString('en-IN')}{' '}
              <span className="metric-unit">pending</span>
            </div>
            <p className="metric-subtext">
              {expenseSummary?.pending_approval_count ?? 1} claim awaiting manager review
            </p>

            <div className="expense-stat-row">
              <div className="stat-pill">
                <span className="stat-num">{expenseSummary?.approved_count ?? 1}</span>
                <span className="stat-lbl">Approved</span>
              </div>
              <div className="stat-pill">
                <span className="stat-num">{expenseSummary?.paid_count ?? 1}</span>
                <span className="stat-lbl">Settled/Paid</span>
              </div>
            </div>
          </div>

          <div className="metric-footer">
            <span>Track claims &amp; receipts</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </div>

        {/* Card 3: Internal Service Desk */}
        <div className="metric-card request-metric-card" onClick={() => navigate('/requests')}>
          <div className="metric-header">
            <div className="metric-icon-box bg-purple-subtle">
              <LifeBuoy style={{ width: 18, height: 18, color: '#7C3AED' }} />
            </div>
            <span className="metric-badge">SERVICE DESK</span>
          </div>

          <div className="metric-body">
            <div className="metric-big-number">
              {data?.open_requests_count ?? 2} <span className="metric-unit">open tickets</span>
            </div>
            <p className="metric-subtext">
              Active IT access, hardware, or HR documentation requests
            </p>

            <div className="ticket-status-preview">
              <span className="ticket-tag">REQ-2026-001 (Bloomberg)</span>
              <span className="ticket-progress-pill">IN PROGRESS</span>
            </div>
          </div>

          <div className="metric-footer">
            <span>View service requests</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </div>

        {/* Card 4: Approvals (If Manager or Admin) */}
        {(emp?.role === 'MANAGER' || emp?.role === 'ADMIN') && (
          <div className="metric-card approval-metric-card" onClick={() => navigate('/approvals')}>
            <div className="metric-header">
              <div className="metric-icon-box bg-amber-subtle">
                <ShieldCheck style={{ width: 18, height: 18, color: '#D97706' }} />
              </div>
              <span className="metric-badge">MANAGER WORKSPACE</span>
            </div>

            <div className="metric-body">
              <div className="metric-big-number">
                {data?.pending_approvals_count ?? 2} <span className="metric-unit">awaiting you</span>
              </div>
              <p className="metric-subtext">
                Pending leave &amp; expense claims from direct reportees
              </p>
            </div>

            <div className="metric-footer">
              <span>Open approval queue</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. QUICK ACTIONS BAR ───────────────────────────────────── */}
      <div className="dashboard-quick-actions-bar">
        <span className="quick-actions-label">QUICK WORKFLOWS</span>
        <div className="quick-buttons-row">
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/leave')}
          >
            <Plus style={{ width: 14, height: 14, color: '#0D9488' }} />
            <span>Apply for Leave</span>
          </button>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/reimbursements')}
          >
            <Plus style={{ width: 14, height: 14, color: '#0284C7' }} />
            <span>Submit Reimbursement</span>
          </button>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/requests')}
          >
            <Plus style={{ width: 14, height: 14, color: '#7C3AED' }} />
            <span>Create IT/HR Ticket</span>
          </button>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/onboarding')}
          >
            <GraduationCap style={{ width: 14, height: 14, color: '#0EA5E9' }} />
            <span>Onboarding Checklist</span>
          </button>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/assistant')}
          >
            <Sparkles style={{ width: 14, height: 14, color: '#F59E0B' }} />
            <span>Ask Policy Assistant</span>
          </button>
        </div>
      </div>

      {/* ─── 4. SPLIT SECTION: RECENT ACTIVITY & TRADING HOLIDAYS ───── */}
      <div className="dashboard-split-layout">
        {/* Left: Recent Activity Feed */}
        <div className="dashboard-card-section">
          <div className="section-title-row">
            <h3>Recent Activity</h3>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => navigate('/activity')}
            >
              View all activity
            </button>
          </div>

          <div className="activity-list-container">
            {data?.recent_activities && data.recent_activities.length > 0 ? (
              data.recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="activity-item-row"
                  onClick={() => navigate(act.link || '/activity')}
                >
                  <div className={`activity-icon-badge type-${act.type.toLowerCase()}`}>
                    {act.type === 'LEAVE' ? (
                      <Calendar style={{ width: 14, height: 14 }} />
                    ) : act.type === 'EXPENSE' ? (
                      <CreditCard style={{ width: 14, height: 14 }} />
                    ) : (
                      <LifeBuoy style={{ width: 14, height: 14 }} />
                    )}
                  </div>
                  <div className="activity-info">
                    <div className="activity-header">
                      <span className="activity-title">{act.title}</span>
                      <span className={`status-chip status-${act.status.toLowerCase()}`}>
                        {act.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="activity-subtitle">{act.subtitle}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-hint">No recent activities on record.</p>
            )}
          </div>
        </div>

        {/* Right: NSE/BSE Trading & Public Holidays Calendar */}
        <div className="dashboard-card-section">
          <div className="section-title-row">
            <h3>2026 Market &amp; Office Holidays</h3>
            <span className="holiday-calendar-tag">NSE / BSE &amp; MUMBAI</span>
          </div>

          <div className="holidays-scroll-list">
            {data?.upcoming_holidays?.slice(0, 5).map((h) => (
              <div key={h.date} className="holiday-item-card">
                <div className="holiday-date-box">
                  <span className="holiday-day">{new Date(h.date).getDate()}</span>
                  <span className="holiday-month">
                    {new Date(h.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                  </span>
                </div>
                <div className="holiday-details">
                  <div className="holiday-name-row">
                    <span className="holiday-name">{h.name}</span>
                    {h.is_trading_holiday && (
                      <span className="trading-closed-tag">MARKET CLOSED</span>
                    )}
                  </div>
                  <span className="holiday-sub">{h.day_of_week} • {h.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
