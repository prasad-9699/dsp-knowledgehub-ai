import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  ExternalLink,
  Users,
  Layers,
  Activity,
  Lock
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INTEGRATIONS' | 'AUDIT_LOGS' | 'DEMO_EMPLOYEES'>('INTEGRATIONS');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [intRes, audRes] = await Promise.all([
        selfServiceAPI.getAdminIntegrations(),
        selfServiceAPI.getAuditLogs(30),
      ]);
      if (intRes.data?.success && intRes.data.data) {
        setIntegrations(intRes.data.data);
      }
      if (audRes.data?.success && audRes.data.data) {
        setAuditLogs(audRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin integrations', err);
    } finally {
      setLoading(false);
    }
  };

  const DEMO_EMPLOYEE_ACCOUNTS = [
    {
      code: 'EMP-1001',
      name: 'Aditi Sharma',
      email: 'aditi.sharma@dspamc.com',
      role: 'EMPLOYEE',
      designation: 'Senior Investment Analyst',
      dept: 'Equities & Wealth Management',
      manager: 'EMP-1004 (Vikram Malhotra)',
      password: 'Password@123',
    },
    {
      code: 'EMP-1002',
      name: 'Rohan Mehta',
      email: 'rohan.mehta@dspamc.com',
      role: 'EMPLOYEE',
      designation: 'Quantitative Strategist',
      dept: 'Quantitative Strategies & Risk',
      manager: 'EMP-1004 (Vikram Malhotra)',
      password: 'Password@123',
    },
    {
      code: 'EMP-1003',
      name: 'Priya Nair',
      email: 'priya.nair@dspamc.com',
      role: 'COMPLIANCE',
      designation: 'Compliance Specialist',
      dept: 'Legal & Regulatory Compliance',
      manager: 'EMP-1005 (Ananya Desai)',
      password: 'Password@123',
    },
    {
      code: 'EMP-1004',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@dspamc.com',
      role: 'MANAGER',
      designation: 'Managing Director & Head of Equities',
      dept: 'Equities & Asset Management',
      manager: 'EMP-1005 (Ananya Desai)',
      password: 'Password@123',
    },
    {
      code: 'EMP-1005',
      name: 'Ananya Desai',
      email: 'ananya.desai@dspamc.com',
      role: 'ADMIN',
      designation: 'Chief Operating Officer & System Admin',
      dept: 'Executive Leadership & Operations',
      manager: 'Board of Directors',
      password: 'Password@123',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading enterprise administration subsystem...</p>
      </div>
    );
  }

  return (
    <div className="self-service-page-container">
      {/* ─── PAGE HEADER ────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <Lock style={{ width: 12, height: 12, color: '#DC2626' }} />
            <span>RESTRICTED ENTERPRISE ADMINISTRATION</span>
          </div>
          <h1 className="page-title">Enterprise System Integrations &amp; Audit</h1>
          <p className="page-subtext">
            Monitor adapters connecting DSPAMC to corporate SSO, PeoplePulse HRMS, SAP Concur, Jira Service Management, and immutable audit logs.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="filter-chips-row">
          <button
            type="button"
            className={`filter-chip ${activeTab === 'INTEGRATIONS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('INTEGRATIONS')}
          >
            Adapters ({integrations.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'AUDIT_LOGS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('AUDIT_LOGS')}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'DEMO_EMPLOYEES' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('DEMO_EMPLOYEES')}
          >
            Demo Provisioning (5)
          </button>
        </div>
      </div>

      {/* ─── TAB 1: INTEGRATIONS ADAPTERS ───────────────────────────── */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="admin-adapters-grid">
          {integrations.map((adapter, idx) => (
            <div key={idx} className="adapter-card">
              <div className="adapter-card-header">
                <div className="adapter-icon-box">
                  <Server style={{ width: 18, height: 18, color: '#0284C7' }} />
                </div>
                <div className="adapter-status-pill">
                  <span className="adapter-dot" />
                  <span>{adapter.status}</span>
                </div>
              </div>

              <h3 className="adapter-name">{adapter.name}</h3>
              <div className="adapter-protocol-badge">Protocol: {adapter.protocol}</div>

              <div className="adapter-meta-grid">
                <div className="meta-col">
                  <span className="lbl">Target Production Endpoint</span>
                  <span className="val font-mono">{adapter.production_endpoint}</span>
                </div>
                {adapter.capabilities && (
                  <div className="meta-col">
                    <span className="lbl">Capabilities</span>
                    <span className="val">{adapter.capabilities.join(' • ')}</span>
                  </div>
                )}
              </div>

              <div className="adapter-notes-box">
                <p>{adapter.notes}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: AUDIT LOGS ──────────────────────────────────────── */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="dashboard-card-section">
          <div className="section-title-row">
            <h3>Immutable System Audit Trail</h3>
            <span className="table-count-tag">Real-Time Event Stream</span>
          </div>

          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity Reference</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className="font-semibold text-primary">{log.actor_name}</span>{' '}
                    <span className="text-secondary text-xs">({log.actor_code})</span>
                  </td>
                  <td>
                    <span className="audit-action-chip">{log.action}</span>
                  </td>
                  <td className="font-semibold">{log.entity_id}</td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: DEMO EMPLOYEE PROVISIONING ──────────────────────── */}
      {activeTab === 'DEMO_EMPLOYEES' && (
        <div className="dashboard-card-section">
          <div className="section-title-row">
            <h3>Provisioned Synthetic Employee Personas</h3>
            <span className="demo-notice-tag">FOR DEMONSTRATION &amp; EVALUATION ONLY</span>
          </div>

          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Department &amp; Title</th>
                <th>Manager</th>
                <th>Demo Credentials</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_EMPLOYEE_ACCOUNTS.map((emp) => (
                <tr key={emp.code}>
                  <td className="font-semibold font-mono text-primary">{emp.code}</td>
                  <td className="font-semibold">{emp.name}</td>
                  <td>
                    <span className={`role-chip role-${emp.role.toLowerCase()}`}>{emp.role}</span>
                  </td>
                  <td>
                    <div>{emp.designation}</div>
                    <div className="text-xs text-secondary">{emp.dept}</div>
                  </td>
                  <td>{emp.manager}</td>
                  <td>
                    <div className="font-mono text-xs">
                      <div>User: {emp.email}</div>
                      <div>Pass: {emp.password}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
