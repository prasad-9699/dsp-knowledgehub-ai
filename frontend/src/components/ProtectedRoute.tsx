/**
 * DSP KnowledgeHub AI — Protected & Role-Enforced Route Wrapper
 */
import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, authChecked, user } = useAppStore();
  const location = useLocation();

  // If session verification is still initializing on startup/refresh
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B132B',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0EA5E9, #0D9488)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(14, 165, 233, 0.35)',
          marginBottom: '1.25rem',
          animation: 'pulse 1.8s infinite ease-in-out',
        }}>
          <Sparkles style={{ width: 28, height: 28, color: '#FFFFFF' }} />
        </div>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', color: '#F8FAFC' }}>
          DSP KnowledgeHub AI
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '0.375rem' }}>
          Verifying secure organizational session...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || '').toUpperCase();
    const hasRole = allowedRoles.some((r) => r.toUpperCase() === userRole);

    if (!hasRole) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          maxWidth: 600,
          margin: '2rem auto',
          background: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <ShieldAlert style={{ width: 24, height: 24 }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
            Privilege Authorization Required
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your account ({user?.full_name || 'Employee'}, role: <strong>{user?.role}</strong>) does not have authorization
            to access this workspace. Authorized roles: {allowedRoles.join(', ')}.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: '#0D9488',
              color: '#FFFFFF',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Return to Home Dashboard
          </Link>
        </div>
      );
    }
  }

  return <Outlet />;
}
