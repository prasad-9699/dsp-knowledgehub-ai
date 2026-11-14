/**
 * DSPAMC Employee SSO Portal — DSP KnowledgeHub AI
 * Single-Login Authentication with Session Establishment & User Registration
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building,
  UserCheck,
  UserPlus,
  Briefcase,
  User,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import DspLogo from '../components/DspLogo';

interface CustomPersona {
  code: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  department?: string;
  password?: string;
}

const DEFAULT_PERSONAS = [
  {
    code: 'EMP-1001',
    name: 'Aditi Sharma',
    shortName: 'Aditi S.',
    role: 'Employee',
    designation: 'Senior Investment Analyst',
    password: 'Password@123',
    iconColor: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#ccfbf1',
    icon: UserCheck,
  },
  {
    code: 'EMP-1004',
    name: 'Vikram Malhotra',
    shortName: 'Vikram M.',
    role: 'Manager',
    designation: 'Managing Director & Head of Equities',
    password: 'Password@123',
    iconColor: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#e0f2fe',
    icon: Building,
  },
  {
    code: 'EMP-1005',
    name: 'Ananya Desai',
    shortName: 'Ananya D.',
    role: 'Admin',
    designation: 'Chief Operating Officer & System Admin',
    password: 'Password@123',
    iconColor: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fef3c7',
    icon: Lock,
  },
  {
    code: 'EMP-1003',
    name: 'Priya Nair',
    shortName: 'Priya N.',
    role: 'Compliance',
    designation: 'Compliance Specialist',
    password: 'Password@123',
    iconColor: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ede9fe',
    icon: ShieldCheck,
  },
];

const DEPARTMENTS = [
  'Equities & Wealth Management',
  'Operations & Administration',
  'Risk & Regulatory Compliance',
  'Technology & Engineering',
  'Human Resources & Talent',
  'Fixed Income & Treasury',
];

const ROLES = [
  { value: 'EMPLOYEE', label: 'Employee / Analyst' },
  { value: 'MANAGER', label: 'Manager / Department Head' },
  { value: 'ADMIN', label: 'System Admin / HR Admin' },
  { value: 'COMPLIANCE', label: 'Compliance Officer' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading, isAuthenticated, sessionError, setSessionError } = useAppStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('EMP-1001');
  const [password, setPassword] = useState('Password@123');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmpCode, setRegEmpCode] = useState('');
  const [regRole, setRegRole] = useState('EMPLOYEE');
  const [regDept, setRegDept] = useState(DEPARTMENTS[0]);
  const [regDesignation, setRegDesignation] = useState('');
  const [regPassword, setRegPassword] = useState('Password@123');

  const [localError, setLocalError] = useState<string | null>(null);
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([]);

  const from = (location.state as any)?.from?.pathname || '/';

  // Load custom personas from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dsp_custom_personas');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomPersonas(parsed);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSessionError(null);

    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      const err = useAppStore.getState().sessionError;
      setLocalError(err || 'Authentication failed. Please verify your Employee ID or corporate email and password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSessionError(null);

    if (!regFullName.trim() || !regEmail.trim()) {
      setLocalError('Full name and email address are required.');
      return;
    }

    const payload = {
      full_name: regFullName.trim(),
      email: regEmail.trim(),
      employee_code: regEmpCode.trim() || undefined,
      role: regRole,
      department: regDept,
      designation: regDesignation.trim() || 'Investment Professional',
      password: regPassword || 'Password@123',
    };

    const success = await register(payload);
    if (success) {
      // Save newly registered user into local custom personas for 1-click testing
      const registeredUser = useAppStore.getState().user;
      const assignedCode = registeredUser?.employee_code || regEmpCode.trim() || 'EMP-NEW';

      const newPersona: CustomPersona = {
        code: assignedCode,
        name: regFullName.trim(),
        email: regEmail.trim(),
        role: regRole,
        department: regDept,
        designation: regDesignation.trim() || 'Investment Professional',
        password: regPassword || 'Password@123',
      };

      try {
        const existing = JSON.parse(localStorage.getItem('dsp_custom_personas') || '[]');
        const filtered = existing.filter(
          (p: any) => p.code?.toLowerCase() !== assignedCode.toLowerCase() && p.email?.toLowerCase() !== regEmail.trim().toLowerCase()
        );
        const updated = [...filtered, newPersona];
        localStorage.setItem('dsp_custom_personas', JSON.stringify(updated));
        setCustomPersonas(updated);
      } catch {
        // ignore storage errors
      }

      navigate(from, { replace: true });
    } else {
      const err = useAppStore.getState().sessionError;
      setLocalError(err || 'User registration failed. Please try again.');
    }
  };

  const handleQuickLogin = async (roleIdentifier: string, rolePass: string) => {
    setEmail(roleIdentifier);
    setPassword(rolePass);
    setLocalError(null);
    setSessionError(null);

    const success = await login(roleIdentifier, rolePass);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setLocalError(`Authentication failed for persona (${roleIdentifier}).`);
    }
  };

  const handleDeleteCustomPersona = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const updated = customPersonas.filter((p) => p.code !== code);
    setCustomPersonas(updated);
    try {
      localStorage.setItem('dsp_custom_personas', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const displayError = localError || sessionError;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #1c2541, #0b132b 85%)',
        padding: '1.5rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          padding: '2.25rem',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.875rem',
            }}
          >
            <DspLogo variant="card" size={54} withGlow={true} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
            DSP KnowledgeHub AI
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            DSP Asset Management Company • Employee Self-Service Platform
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Create New User */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setLocalError(null);
              setSessionError(null);
            }}
            style={{
              flex: 1,
              padding: '0.625rem 0.5rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'signin' ? 700 : 500,
              color: activeTab === 'signin' ? '#0d9488' : '#64748b',
              borderBottom: activeTab === 'signin' ? '2.5px solid #0d9488' : '2.5px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Lock style={{ width: 15, height: 15 }} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLocalError(null);
              setSessionError(null);
            }}
            style={{
              flex: 1,
              padding: '0.625rem 0.5rem',
              fontSize: '0.875rem',
              fontWeight: activeTab === 'register' ? 700 : 500,
              color: activeTab === 'register' ? '#0d9488' : '#64748b',
              borderBottom: activeTab === 'register' ? '2.5px solid #0d9488' : '2.5px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus style={{ width: 15, height: 15 }} />
            <span>Create New User</span>
          </button>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* ─── TAB 1: Sign In Form ─── */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.375rem',
                }}
              >
                Employee ID or Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16,
                    height: 16,
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMP-1001 or aditi.sharma@dspamc.com"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem 0.625rem 2.4rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                Enter your assigned DSPAMC badge code or Outlook email address
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.375rem',
                }}
              >
                Corporate Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16,
                    height: 16,
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem 0.625rem 2.4rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                marginTop: '0.25rem',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
              }}
            >
              <span>{isLoading ? 'Establishing Secure Session...' : 'Sign In via Single-Login SSO'}</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </form>
        )}

        {/* ─── TAB 2: Create New User Form ─── */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.25rem',
                }}
              >
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 15,
                    height: 15,
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Rohit Verma"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.3rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.25rem',
                }}
              >
                Corporate Email *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 15,
                    height: 15,
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. rohit.verma@dspamc.com"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.3rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.25rem',
                  }}
                >
                  Employee ID
                </label>
                <input
                  type="text"
                  value={regEmpCode}
                  onChange={(e) => setRegEmpCode(e.target.value)}
                  placeholder="Auto (e.g. EMP-1006)"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.25rem',
                  }}
                >
                  System Role *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.25rem',
                  }}
                >
                  Department
                </label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.25rem',
                  }}
                >
                  Designation
                </label>
                <input
                  type="text"
                  value={regDesignation}
                  onChange={(e) => setRegDesignation(e.target.value)}
                  placeholder="e.g. Investment Analyst"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.25rem',
                }}
              >
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute',
                    left: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 15,
                    height: 15,
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.3rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                marginTop: '0.25rem',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
              }}
            >
              <span>{isLoading ? 'Registering User...' : 'Create User & Sign In'}</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </form>
        )}

        {/* ─── Quick Testing Personas (1-Click) ─── */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.625rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
            }}
          >
            <Sparkles style={{ width: 13, height: 13, color: '#0d9488' }} />
            <span>Instant Role Test Personas (1-Click)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {DEFAULT_PERSONAS.map((persona) => {
              const Icon = persona.icon;
              return (
                <button
                  key={persona.code}
                  type="button"
                  onClick={() => handleQuickLogin(persona.code, persona.password)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.5rem 0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${persona.name} (${persona.designation})`}
                >
                  <Icon style={{ width: 14, height: 14, color: persona.iconColor, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {persona.shortName}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{persona.role}</div>
                  </div>
                </button>
              );
            })}

            {/* Custom Created Personas */}
            {customPersonas.map((persona) => {
              const isMgr = persona.role?.toUpperCase().includes('MAN');
              const isAdm = persona.role?.toUpperCase().includes('ADM');
              const isComp = persona.role?.toUpperCase().includes('COMP');
              const color = isAdm ? '#f59e0b' : isMgr ? '#0284c7' : isComp ? '#8b5cf6' : '#10b981';

              return (
                <button
                  key={persona.code}
                  type="button"
                  onClick={() => handleQuickLogin(persona.code, persona.password || 'Password@123')}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.5rem 0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#fcfdfa',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${persona.name} (${persona.code} - ${persona.role})`}
                >
                  <User style={{ width: 14, height: 14, color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span>{persona.name.split(' ')[0]}</span>
                      <span
                        style={{
                          fontSize: '0.5625rem',
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '0.05rem 0.25rem',
                          borderRadius: '0.25rem',
                          fontWeight: 700,
                        }}
                      >
                        NEW
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                      {persona.code} • {persona.role}
                    </div>
                  </div>
                  <div
                    onClick={(e) => handleDeleteCustomPersona(e, persona.code)}
                    title="Remove custom persona"
                    style={{
                      padding: '0.2rem',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: '0.25rem',
                    }}
                  >
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.6875rem', color: '#94a3b8' }}>
          Restricted to authorized DSPAMC personnel • Secured via 2FA Single Sign-On
        </div>
      </div>
    </div>
  );
}
