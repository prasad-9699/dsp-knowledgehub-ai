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
import { useAppStore } from '../store/useAppStore';

function getInitialDashboard(user: any): EmployeeDashboardData {
  const name = user?.full_name || 'DSP Professional';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PJ';
  const code = user?.employee_code || 'EMP-1001';
  const role = user?.role || 'EMPLOYEE';
  const dept = user?.department || 'Equities & Wealth Management';
  const desig = user?.designation || 'Investment Professional';

  return {
    employee: {
      id: user?.id || 'emp-demo',
      employee_code: code,
      email: user?.email || 'employee@dspamc.com',
      full_name: name,
      department: dept,
      designation: desig,
      role: role,
      location: 'Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)',
      manager_code: 'EMP-1004',
      manager_name: 'Vikram Malhotra',
      avatar_initials: initials,
      date_of_joining: '2024-04-15',
      is_active: true,
      is_demo: true,
    },
    leave_summary: {
      employee_code: code,
      year: 2026,
      total_available: 41,
      upcoming_approved_days: 0,
      categories: [
        {
          category_id: 'pl',
          category_name: 'Privilege Leave',
          code: 'PL',
          allocated: 24,
          used: 2,
          pending: 0,
          available: 22,
          description: 'Annual vacation quota.',
        },
        {
          category_id: 'csl',
          category_name: 'Casual & Sick Leave',
          code: 'CSL',
          allocated: 12,
          used: 1,
          pending: 0,
          available: 11,
          description: 'Short-term medical/emergency.',
        },
        {
          category_id: 'comp_off',
          category_name: 'Compensatory Off',
          code: 'COMP_OFF',
          allocated: 5,
          used: 0,
          pending: 0,
          available: 5,
          description: 'Weekend duty compensatory credit.',
        },
      ],
    },
    expense_summary: {
      employee_code: code,
      total_claims: 3,
      pending_approval_count: 1,
      pending_approval_amount: 3200,
      approved_count: 2,
      approved_amount: 48500,
      paid_count: 2,
      paid_amount: 48500,
      currency: 'INR',
    },
    open_requests_count: 1,
    pending_approvals_count: role === 'MANAGER' || role === 'ADMIN' ? 3 : 0,
    recent_activities: [
      {
        id: 'act-1',
        type: 'LEAVE',
        title: 'Privilege Leave Approved',
        subtitle: 'Annual Vacation • 2 days',
        status: 'APPROVED',
        timestamp: '2026-11-10T09:30:00Z',
        link: '/leave',
      },
      {
        id: 'act-2',
        type: 'EXPENSE',
        title: 'Client Lunch Reimbursement',
        subtitle: 'Equities Research Meeting • ₹3,200',
        status: 'PENDING',
        timestamp: '2026-11-08T14:15:00Z',
        link: '/reimbursements',
      },
      {
        id: 'act-3',
        type: 'SERVICE_DESK',
        title: 'Bloomberg Terminal Key Refresh',
        subtitle: 'IT Infrastructure Ticket #8841',
        status: 'RESOLVED',
        timestamp: '2026-11-05T11:00:00Z',
        link: '/requests',
      },
    ],
    upcoming_holidays: [
      {
        date: '2026-11-26',
        name: 'Gurunanak Jayanti',
        day_of_week: 'Thursday',
        is_trading_holiday: true,
        description: 'NSE / BSE & Banking Holiday',
      },
      {
        date: '2026-12-25',
        name: 'Christmas Day',
        day_of_week: 'Friday',
        is_trading_holiday: true,
        description: 'National & Market Holiday',
      },
      {
        date: '2027-01-26',
        name: 'Republic Day',
        day_of_week: 'Tuesday',
        is_trading_holiday: true,
        description: 'National Holiday',
      },
    ],
    is_demo_data: true,
  };
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [data, setData] = useState<EmployeeDashboardData>(() => getInitialDashboard(user));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await selfServiceAPI.getDashboard();
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      // Keep rich instant dashboard data
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
