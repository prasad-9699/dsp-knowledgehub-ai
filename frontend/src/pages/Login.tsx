/**
 * DSPAMC Employee SSO Portal — DSP KnowledgeHub AI
 * Single-Login Authentication with Session Establishment
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Building, UserCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import DspLogo from '../components/DspLogo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, sessionError, setSessionError } = useAppStore();

  const [email, setEmail] = useState('EMP-1001');
  const [password, setPassword] = useState('Password@123');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSessionError(null);

    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setLocalError('Authentication failed. Please verify your Employee ID or corporate email and password.');
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
      setLocalError('Authentication failed for selected persona.');
    }
  };

  const displayError = localError || sessionError;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1c2541, #0b132b 85%)',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '1rem',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
        padding: '2.5rem',
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <DspLogo variant="card" size={56} withGlow={true} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
            DSP KnowledgeHub AI
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            DSP Asset Management Company • Employee Self-Service Platform
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div style={{
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
          }}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Employee ID or Corporate Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
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
                  transition: 'border-color 0.15s ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
              Enter your assigned DSPAMC badge code or Outlook email address
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Corporate Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
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
              marginTop: '0.5rem',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            <span>{isLoading ? 'Establishing Secure Session...' : 'Sign In via Single-Login SSO'}</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </form>

        {/* Quick Testing Personas */}
        <div style={{ marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.125rem' }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.625rem',
            textAlign: 'center'
          }}>
            Instant Role Test Personas (1-Click)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('EMP-1001', 'Password@123')}
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
              }}
              title="Senior Investment Analyst (Aditi Sharma)"
            >
              <UserCheck style={{ width: 14, height: 14, color: '#0d9488', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Aditi S.</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Employee</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('EMP-1004', 'Password@123')}
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
              }}
              title="Managing Director & Head of Equities (Vikram Malhotra)"
            >
              <Building style={{ width: 14, height: 14, color: '#0284c7', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Vikram M.</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Manager</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('EMP-1005', 'Password@123')}
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
              }}
              title="Chief Operating Officer & System Admin (Ananya Desai)"
            >
              <Lock style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Ananya D.</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Admin</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('EMP-1003', 'Password@123')}
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
              }}
              title="Compliance Specialist (Priya Nair)"
            >
              <ShieldCheck style={{ width: 14, height: 14, color: '#8b5cf6', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Priya N.</div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Compliance</div>
              </div>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.6875rem', color: '#94a3b8' }}>
          Restricted to authorized DSPAMC personnel • Secured via 2FA Single Sign-On
        </div>
      </div>
    </div>
  );
}
