import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Key,
  CreditCard,
  Scale,
  HelpCircle,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  LayoutDashboard,
  Clock,
  CheckSquare,
  Settings,
  LifeBuoy,
  User,
  GraduationCap,
  Users
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { researchAPI } from '../services/api';
import type { ConversationRecord } from '../services/api';
import DspLogo from './DspLogo';

interface AppSidebarProps {
  onNewChat?: () => void;
  onOpenLibrary?: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function AppSidebar({
  onNewChat,
  onOpenLibrary,
  onSelectConversation,
  activeConversationId,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, sidebarCollapsed, toggleSidebar } = useAppStore();

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'compliance';
  const isAdmin = user?.role === 'admin';

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, [activeConversationId]);

  const fetchConversations = async () => {
    try {
      const res = await researchAPI.getConversations();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setConversations(res.data.data);
      }
    } catch (e) {
      // Graceful fallback
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await researchAPI.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id && onNewChat) {
        onNewChat();
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleStartNewConversation = () => {
    if (location.pathname !== '/assistant') {
      navigate('/assistant');
    }
    if (onNewChat) {
      onNewChat();
    }
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleSelectConv = (id: string) => {
    if (location.pathname !== '/assistant') {
      navigate('/assistant');
    }
    if (onSelectConversation) {
      onSelectConversation(id);
    }
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DP';

  const isCollapsed = !isMobileDrawer && sidebarCollapsed;

  const closeDrawer = () => {
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside
      className={`app-sidebar-root ${isCollapsed ? 'is-collapsed' : 'is-expanded'} ${
        isMobileDrawer ? 'is-mobile-drawer' : ''
      }`}
    >
      {/* ─── BRAND HEADER ─────────────────────────────────────────── */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-group" onClick={() => { navigate('/'); closeDrawer(); }}>
          <DspLogo variant={isCollapsed ? "badge" : "card"} size={34} />
          {!isCollapsed && (
            <div className="brand-title-box">
              <span className="brand-primary-name">KnowledgeHub</span>
              <span className="brand-sub-badge">SELF-SERVICE</span>
            </div>
          )}
        </div>

        {!isMobileDrawer && (
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label="Toggle navigation width"
          >
            {isCollapsed ? (
              <ChevronRight style={{ width: 15, height: 15 }} />
            ) : (
              <ChevronLeft style={{ width: 15, height: 15 }} />
            )}
          </button>
        )}
      </div>

      {/* ─── PRIMARY ACTION: NEW AI QUERY ─────────────────────────── */}
      <div className="sidebar-action-wrap">
        <button
          type="button"
          className="new-chat-primary-btn"
          onClick={handleStartNewConversation}
          title="Ask AI Copilot"
        >
          <Sparkles style={{ width: 16, height: 16, flexShrink: 0 }} />
          {!isCollapsed && <span>Ask AI Copilot</span>}
        </button>
      </div>

      {/* ─── SCROLLABLE NAV BODY ─────────────────────────────────── */}
      <div className="sidebar-nav-scroll">
        {/* Core Employee Self-Service Links */}
        <div className="nav-group-section">
          {!isCollapsed && <div className="nav-section-label">EMPLOYEE PORTAL</div>}

          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="Dashboard Overview"
            onClick={closeDrawer}
          >
            <LayoutDashboard className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">Home Dashboard</span>}
          </NavLink>

          <NavLink
            to="/assistant"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="AI Knowledge & Self-Service Assistant"
            onClick={closeDrawer}
          >
            <Sparkles className="sidebar-nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-link-label">AI Assistant</span>
                <span className="nav-badge-pill" style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#0284c7' }}>3D</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/leave"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="My Leave & Absence"
            onClick={closeDrawer}
          >
            <Calendar className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">My Leave</span>}
          </NavLink>

          <NavLink
            to="/reimbursements"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="My Reimbursements & Claims"
            onClick={closeDrawer}
          >
            <CreditCard className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">My Reimbursements</span>}
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="Internal Service Desk & IT Requests"
            onClick={closeDrawer}
          >
            <LifeBuoy className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">My Requests</span>}
          </NavLink>

          <NavLink
            to="/policies"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="Knowledge Library (Authorized policies)"
            onClick={closeDrawer}
          >
            <BookOpen className="sidebar-nav-icon" />
            {!isCollapsed && (
              <>
                <span className="nav-link-label">Knowledge Library</span>
                <span className="nav-badge-pill">Policies</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/activity"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="Unified Activity History"
            onClick={closeDrawer}
          >
            <Clock className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">My Activity</span>}
          </NavLink>

          <NavLink
            to="/onboarding"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="My Onboarding"
            onClick={closeDrawer}
          >
            <GraduationCap className="sidebar-nav-icon" style={{ color: '#0ea5e9' }} />
            {!isCollapsed && (
              <>
                <span className="nav-link-label">Onboarding</span>
                <span className="nav-badge-pill" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>New</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
            title="Employee Profile & Credentials"
            onClick={closeDrawer}
          >
            <User className="sidebar-nav-icon" />
            {!isCollapsed && <span className="nav-link-label">Profile</span>}
          </NavLink>
        </div>

        {/* ─── MANAGER & APPROVER WORKSPACE (Role Protected) ───────── */}
        {isManagerOrAdmin && (
          <div className="nav-group-section" style={{ marginTop: '0.75rem' }}>
            {!isCollapsed && <div className="nav-section-label">GOVERNANCE & APPROVALS</div>}

            <NavLink
              to="/approvals"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
              title="Manager Approvals Queue"
              onClick={closeDrawer}
            >
              <CheckSquare className="sidebar-nav-icon" style={{ color: '#059669' }} />
              {!isCollapsed && (
                <>
                  <span className="nav-link-label">Approvals</span>
                  <span className="nav-badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>Manager</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/onboarding/hr"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
              title="HR Onboarding Workspace"
              onClick={closeDrawer}
            >
              <Users className="sidebar-nav-icon" style={{ color: '#0ea5e9' }} />
              {!isCollapsed && (
                <>
                  <span className="nav-link-label">HR Onboarding</span>
                  <span className="nav-badge-pill" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>HR</span>
                </>
              )}
            </NavLink>
          </div>
        )}

        {/* ─── ADMINISTRATIVE & SYSTEM INTEGRATIONS (Admin Only) ───── */}
        {isAdmin && (
          <div className="nav-group-section" style={{ marginTop: '0.5rem' }}>
            {!isCollapsed && <div className="nav-section-label">ADMINISTRATION</div>}

            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
              title="Enterprise Integrations & Audit Logs"
              onClick={closeDrawer}
            >
              <Settings className="sidebar-nav-icon" style={{ color: '#6366f1' }} />
              {!isCollapsed && (
                <>
                  <span className="nav-link-label">Integrations & Audit</span>
                  <span className="nav-badge-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>Admin</span>
                </>
              )}
            </NavLink>
          </div>
        )}

        {/* ─── RECENT CONVERSATIONS (Collapsible) ───────────────────── */}
        {!isCollapsed && (
          <div className="sidebar-accordion-section" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="accordion-toggle-btn"
              onClick={() => setRecentOpen(!recentOpen)}
            >
              <span className="accordion-label">Recent AI Sessions</span>
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  transform: recentOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {recentOpen && (
              <div className="recent-conversations-list">
                {conversations.length === 0 ? (
                  <div className="recent-empty-hint">No saved sessions</div>
                ) : (
                  conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        className={`recent-conv-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectConv(conv.id)}
                      >
                        <MessageSquare
                          style={{
                            width: 13,
                            height: 13,
                            flexShrink: 0,
                            opacity: isActive ? 1 : 0.6,
                          }}
                        />
                        <span className="recent-conv-title">{conv.title}</span>
                        <button
                          type="button"
                          className="recent-delete-btn"
                          title="Delete session"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                        >
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── PROCESS DOSSIERS & POLICIES (Collapsible) ────────────── */}
        <div className="sidebar-accordion-section" style={{ marginTop: '0.5rem' }}>
          {!isCollapsed && (
            <button
              type="button"
              className="accordion-toggle-btn"
              onClick={() => setPoliciesOpen(!policiesOpen)}
            >
              <span className="accordion-label">Policy Guidelines</span>
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  transform: policiesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>
          )}

          {(policiesOpen || isCollapsed) && (
            <div className="nav-group-section">
              <NavLink
                to="/policies"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                title="Policy Catalog"
                onClick={closeDrawer}
              >
                <BookOpen className="sidebar-nav-icon" />
                {!isCollapsed && <span className="nav-link-label">Policy Index</span>}
              </NavLink>

              <NavLink
                to="/onboarding"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                title="Onboarding & Training"
                onClick={closeDrawer}
              >
                <FolderOpen className="sidebar-nav-icon" />
                {!isCollapsed && <span className="nav-link-label">Onboarding Guide</span>}
              </NavLink>

              <NavLink
                to="/it-access"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                title="IT & IAM Policy"
                onClick={closeDrawer}
              >
                <Key className="sidebar-nav-icon" />
                {!isCollapsed && <span className="nav-link-label">IAM & Devices</span>}
              </NavLink>

              <NavLink
                to="/compliance"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                title="Compliance Code"
                onClick={closeDrawer}
              >
                <Scale className="sidebar-nav-icon" />
                {!isCollapsed && <span className="nav-link-label">Compliance Code</span>}
              </NavLink>

              <NavLink
                to="/directory"
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                title="Helpdesk Directory"
                onClick={closeDrawer}
              >
                <HelpCircle className="sidebar-nav-icon" />
                {!isCollapsed && <span className="nav-link-label">Help Directory</span>}
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM USER & SESSION FOOTER ────────────────────────── */}
      <div className="sidebar-user-footer">
        <div
          className="user-profile-badge"
          onClick={() => { navigate('/profile'); closeDrawer(); }}
          style={{ cursor: 'pointer' }}
          title={`View Profile: ${user?.full_name || 'Employee'}`}
        >
          <div className="user-avatar-initials">{initials}</div>
          {!isCollapsed && (
            <div className="user-info-text">
              <span className="user-name">{user?.full_name || 'DSPAMC Employee'}</span>
              <span className="user-role">{user?.role ? user.role.toUpperCase() : 'EMPLOYEE'}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="user-logout-btn"
          title="Sign Out"
          aria-label="Sign out of DSP KnowledgeHub"
        >
          <LogOut style={{ width: 15, height: 15 }} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
