import React, { useState, useEffect } from 'react';
import { Menu, Sparkles, BookOpen, Bell, CheckCircle2, AlertCircle, Info, ExternalLink, X } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { selfServiceAPI } from '../services/api';
import type { InAppNotification } from '../services/api';
import DspLogo from './DspLogo';

interface AppHeaderProps {
  onToggleMobileDrawer: () => void;
  onOpenLibrary?: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Employee Self-Service', subtitle: 'Personalized Workspace & Actions' },
  '/assistant': { title: 'AI Assistant', subtitle: 'DSP Internal Knowledge Copilot' },
  '/leave': { title: 'My Leave', subtitle: 'Balances & Absence Requests' },
  '/reimbursements': { title: 'My Reimbursements', subtitle: 'Expense Claims & Tracking' },
  '/requests': { title: 'My Requests', subtitle: 'Service Desk & IT Support' },
  '/activity': { title: 'My Activity', subtitle: 'Unified Status & History Timeline' },
  '/profile': { title: 'Employee Profile', subtitle: 'Credentials & Statutory Data' },
  '/approvals': { title: 'Manager Approvals', subtitle: 'Governance & Request Decisions' },
  '/admin': { title: 'Integrations & Audit', subtitle: 'Adapter Health & Audit Trail' },
  '/policies': { title: 'Policy Catalog', subtitle: 'Authorized Governance & Policies' },
  '/onboarding': { title: 'Onboarding & Training', subtitle: 'Policy DSP-HR-002 Guidelines' },
  '/it-access': { title: 'IT & IAM Requests', subtitle: 'Policy DSP-IT-001 Guidelines' },
  '/compliance': { title: 'Compliance & Trading', subtitle: 'Policy DSP-COMP-001 Guidelines' },
  '/directory': { title: 'Helpdesk Directory', subtitle: 'Emergency & Department Contacts' },
};

export default function AppHeader({
  onToggleMobileDrawer,
  onOpenLibrary,
}: AppHeaderProps) {
  const location = useLocation();
  const { user } = useAppStore();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentRoute = ROUTE_TITLES[location.pathname] || {
    title: 'KnowledgeHub',
    subtitle: 'DSP Asset Management Company',
  };

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await selfServiceAPI.getNotifications();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter((n: InAppNotification) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch {
      // Graceful fallback
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DP';

  return (
    <header className="app-top-header">
      <div className="header-left-col">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          className="header-mobile-hamburger"
          onClick={onToggleMobileDrawer}
          aria-label="Open navigation menu"
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>

        {/* Section title & breadcrumb */}
        <div className="header-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DspLogo variant="card" size={22} />
          <span className="header-crumb-brand">KnowledgeHub</span>
          <span className="header-crumb-divider">/</span>
          <span className="header-crumb-current">{currentRoute.title}</span>
        </div>
      </div>

      <div className="header-right-col" style={{ position: 'relative' }}>
        {/* Notification Bell with Badge */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="header-action-pill"
            onClick={() => setShowNotifications(!showNotifications)}
            title="In-app notifications"
            style={{ position: 'relative', padding: '0.4rem 0.6rem' }}
          >
            <Bell style={{ width: 16, height: 16, color: '#334155' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '0.625rem',
                fontWeight: 700,
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  In-App Notifications
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    style={{ fontSize: '0.6875rem', color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: '#94a3b8' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f1f5f9',
                        background: n.is_read ? '#fff' : '#f0f9ff',
                        display: 'flex',
                        gap: '0.625rem'
                      }}
                    >
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {n.type === 'APPROVAL' ? (
                          <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />
                        ) : n.type === 'ACTION_REQUIRED' ? (
                          <AlertCircle style={{ width: 14, height: 14, color: '#f59e0b' }} />
                        ) : (
                          <Info style={{ width: 14, height: 14, color: '#0ea5e9' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>{n.title}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>{n.message}</div>
                        <div style={{ fontSize: '0.625rem', color: '#94a3b8', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {onOpenLibrary && (
          <button
            type="button"
            className="header-action-pill hide-on-mobile"
            onClick={onOpenLibrary}
            title="Open Document Knowledge Library"
          >
            <BookOpen style={{ width: 14, height: 14, color: '#0EA5E9' }} />
            <span>Policy Library</span>
          </button>
        )}

        <Link to="/profile" className="header-user-status" title={`View profile: ${user?.full_name || 'Employee'}`}>
          <div className="header-avatar-circle">{initials}</div>
          <span className="header-user-name hide-on-mobile">{user?.full_name || 'Employee'}</span>
        </Link>
      </div>
    </header>
  );
}
