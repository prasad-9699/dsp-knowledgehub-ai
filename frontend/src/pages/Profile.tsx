import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  ShieldCheck,
  Laptop,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  BadgeCheck,
  FileCheck2,
  HeartHandshake
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { selfServiceAPI } from '../services/api';
import type { EmployeeProfile } from '../services/api';

export default function Profile() {
  const { user } = useAppStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(() => {
    if (!user) return null;
    const initials = user.full_name
      ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'PJ';
    return {
      id: user.id || 'emp-demo',
      employee_code: user.employee_code || 'EMP-1001',
      email: user.email,
      full_name: user.full_name,
      department: user.department || 'Equities & Wealth Management',
      designation: user.designation || 'Investment Professional',
      role: user.role,
      location: 'Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)',
      phone: '+91 98201 44512',
      date_of_joining: '2024-04-15',
      manager_code: 'EMP-1004',
      manager_name: 'Vikram Malhotra',
      avatar_initials: initials,
      is_active: true,
      is_demo: true,
    };
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable Form fields
  const [phone, setPhone] = useState('+91 98201 44512');
  const [location, setLocation] = useState('Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)');
  const [emergencyContact, setEmergencyContact] = useState(
    user?.employee_code === 'EMP-1001' ? 'Rajesh Sharma (Spouse)' : 'Primary Family Contact'
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    user?.employee_code === 'EMP-1001' ? '+91 98200 99881' : '+91 98200 12345'
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await selfServiceAPI.getProfile();
      if (res.data?.success && res.data.data) {
        const emp = res.data.data;
        setProfile(emp);
        if (emp.phone) setPhone(emp.phone);
        if (emp.location) setLocation(emp.location);
      }
    } catch (err: any) {
      // Keep instant fallback profile
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setSaving(true);
      const res = await selfServiceAPI.updateProfile({
        phone: phone.trim(),
        location: location.trim(),
      });
      if (res.data?.success && res.data.data) {
        setProfile(res.data.data);
        showToast('Contact and workplace details updated successfully.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading employee record and security credentials...</p>
      </div>
    );
  }

  const emp = profile || {
    id: user?.id || 'demo',
    employee_code: user?.employee_code || 'EMP-1001',
    email: user?.email || 'employee@dspamc.com',
    full_name: user?.full_name || 'DSP Employee',
    department: user?.department || 'Equities & Wealth Management',
    designation: user?.designation || 'Senior Investment Analyst',
    role: user?.role || 'EMPLOYEE',
    location: 'Mumbai - Nariman Point',
    avatar_initials: 'AS',
    date_of_joining: '2022-04-15',
    manager_name: 'Vikram Malhotra',
    is_active: true,
    is_demo: true,
  };

  return (
    <div className="self-service-page-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="hub-toast-banner" role="status">
          <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981', flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <div className="page-meta-badge">
            <span className="badge-pulse-dot" />
            <span>PEOPLEPULSE VERIFIED EMPLOYEE RECORD</span>
          </div>
          <h1 className="page-title">Employee Profile &amp; Credentials</h1>
          <p className="page-subtext">
            View your official organizational position, statutory declarations, designated equipment, and contact preferences.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="modal-error-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#DC2626', flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── 1. HERO IDENTITY CARD ──────────────────────────────────── */}
      <div className="employee-id-card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div className="employee-avatar-wrapper">
          <div className="employee-avatar-large" style={{ fontSize: '1.75rem' }}>
            {emp.avatar_initials || 'AS'}
          </div>
          <div className="employee-status-dot" title="Active Verified Employee" />
        </div>

        <div className="employee-meta-info" style={{ flex: 1 }}>
          <div className="employee-badge-row">
            <span className="employee-code-pill">{emp.employee_code}</span>
            <span className="employee-dept-pill">{emp.department}</span>
            <span className="status-pill status-approved" style={{ fontSize: '0.75rem' }}>
              <BadgeCheck style={{ width: 13, height: 13, marginRight: 4 }} />
              {emp.role}
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>
            {emp.full_name}
          </h2>

          <div className="employee-details-row" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span className="detail-item">
              <User style={{ width: 14, height: 14, color: '#0D9488' }} />
              {emp.designation}
            </span>
            <span className="detail-divider">•</span>
            <span className="detail-item">
              <Building style={{ width: 14, height: 14, color: '#0D9488' }} />
              Reports to: <strong>{emp.manager_name || 'Vikram Malhotra'}</strong>
            </span>
            <span className="detail-divider">•</span>
            <span className="detail-item">
              <Mail style={{ width: 14, height: 14, color: '#0D9488' }} />
              {emp.email}
            </span>
            <span className="detail-divider">•</span>
            <span className="detail-item">
              <Calendar style={{ width: 14, height: 14, color: '#0D9488' }} />
              Joined: {emp.date_of_joining || '2022-04-15'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. TWO-COLUMN LAYOUT: EDITABLE CONTACT & STATUTORY ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card: Workplace & Contact Information */}
        <div className="dashboard-card-section" style={{ margin: 0 }}>
          <div className="section-title-row" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone style={{ width: 18, height: 18, color: '#0D9488' }} />
              Workplace &amp; Direct Contact
            </h3>
          </div>

          <form onSubmit={handleSaveContact}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                Corporate Mobile Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input-control"
                placeholder="+91 98201 00000"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                Assigned Desk / Office Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input-control"
                placeholder="e.g. Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                Emergency Contact Name &amp; Relationship
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="form-input-control"
                placeholder="Name (Relationship)"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.375rem' }}>
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="form-input-control"
                placeholder="+91 98000 00000"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
            >
              <Save style={{ width: 16, height: 16 }} />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Card: Statutory & Compliance Identifiers */}
        <div className="dashboard-card-section" style={{ margin: 0 }}>
          <div className="section-title-row" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 style={{ width: 18, height: 18, color: '#0D9488' }} />
              Statutory &amp; HR Declarations
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>EPF MEMBER ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>MH/BAN/0048291/000/1042</div>
              </div>
              <span className="status-pill status-approved">Verified</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>UNIVERSAL ACCOUNT NUMBER (UAN)</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>1014 9284 7120</div>
              </div>
              <span className="status-pill status-approved">Linked</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>GROUP MEDICLAIM TPA CARD</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>MEDI-DSP-88294 (Sum Insured INR 10L)</div>
              </div>
              <span className="status-pill status-approved">Active</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PERMANENT ACCOUNT NUMBER (PAN)</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>ABCDE••••F</div>
              </div>
              <span className="status-pill status-approved">SEBI Grounded</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. DESIGNATED IT EQUIPMENT & ACCESS CREDENTIALS ────────── */}
      <div className="dashboard-card-section">
        <div className="section-title-row" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Laptop style={{ width: 18, height: 18, color: '#0D9488' }} />
            Provisioned IT Assets &amp; Entitlements
          </h3>
          <span className="table-count-tag">Asset Track # DSP-IT-SEC-2026</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: 600, fontSize: '0.875rem' }}>
              <Laptop style={{ width: 16, height: 16, color: '#0D9488' }} />
              Primary Workstation
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
              Lenovo ThinkPad T14s Gen 4 (Asset ID: DSP-LT-8812)
            </p>
            <div style={{ fontSize: '0.75rem', color: '#0D9488', marginTop: '0.5rem', fontWeight: 600 }}>
              BitLocker Enforced • CrowdStrike Active
            </div>
          </div>

          <div style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: 600, fontSize: '0.875rem' }}>
              <ShieldCheck style={{ width: 16, height: 16, color: '#0D9488' }} />
              Two-Factor Authentication
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
              Microsoft Authenticator Push Notifications
            </p>
            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 600 }}>
              Enforced for Single Login SSO
            </div>
          </div>

          <div style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: 600, fontSize: '0.875rem' }}>
              <CreditCard style={{ width: 16, height: 16, color: '#0D9488' }} />
              Smart Access Card
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem' }}>
              Badge No: DSP-BKC-0941 (Mafatlal Centre Nariman Point)
            </p>
            <div style={{ fontSize: '0.75rem', color: '#0D9488', marginTop: '0.5rem', fontWeight: 600 }}>
              Levels: Trading Floor + Library Access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
