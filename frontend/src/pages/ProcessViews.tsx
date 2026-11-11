/**
 * DSPAMC HR & Employee Process Views
 * Dedicated process dossier pages for HR, Onboarding, IT, Expenses, and Compliance.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  BookOpen,
  Key,
  CreditCard,
  Scale,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Clock,
  Building,
  User,
  ArrowRight,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  HelpCircle,
  Upload,
  Check
} from 'lucide-react';
import { researchAPI } from '../services/api';
import type { DocumentItem } from '../services/api';
import KnowledgeLibraryModal from '../components/KnowledgeLibraryModal';

// ─── 1. POLICIES & KNOWLEDGE CATALOG PAGE ────────────────────────────

export function PoliciesPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [selectedCat]);

  async function loadDocs() {
    setLoading(true);
    try {
      const cat = selectedCat === 'ALL' ? undefined : selectedCat;
      const res = await researchAPI.getDocuments(cat, query || undefined);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BookOpen style={{ width: 24, height: 24, color: '#0ea5e9' }} />
            DSPAMC Document & Policy Library
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
            Official regulatory repository of approved HR policies, SOPs, IT access manuals, and compliance codes.
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
          onClick={() => setIsUploadOpen(true)}
        >
          <Upload style={{ width: 14, height: 14 }} /> Ingest New Policy
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', flex: 1 }}>
          {['ALL', 'HR', 'IT', 'COMPLIANCE', 'FINANCE', 'OPERATIONS'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '1rem',
                border: selectedCat === c ? '1px solid #0284c7' : '1px solid #e2e8f0',
                background: selectedCat === c ? '#eff6ff' : '#ffffff',
                color: selectedCat === c ? '#0284c7' : '#64748b',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', width: 320 }}>
          <input
            type="text"
            placeholder="Search policies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDocs()}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
            }}
          />
          <button className="btn btn-secondary" onClick={loadDocs} style={{ fontSize: '0.8125rem' }}>
            <Search style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Grid of Documents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '0.125rem 0.5rem', borderRadius: 4 }}>
                  {doc.id}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck style={{ width: 12, height: 12 }} /> {doc.status}
                </span>
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                {doc.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                {doc.summary}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                <span>Dept: {doc.department}</span>
                <span>{doc.version}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem', justifyContent: 'center', gap: '0.375rem' }}
                onClick={() => navigate('/')}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                Ask KnowledgeHub AI about this Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      <KnowledgeLibraryModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}

// ─── 2. LEAVE & ATTENDANCE PROCESS VIEW ──────────────────────────────

export function LeaveProcessPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Calendar style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          DSPAMC Leave & Absence Policy 2026
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Document Ref: <strong>DSP-HR-001 (v4.2)</strong> • Governed by People & Culture
        </p>
      </div>

      {/* Quota Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #0ea5e9' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0ea5e9' }}>18 Days</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Earned Annual Leave (EL)</div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 4 }}>Accrued 4.5 days/quarter</div>
        </div>

        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #10b981' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>12 Days</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Casual / Sick Leave</div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 4 }}>Credited annually on April 1</div>
        </div>

        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>26 Weeks</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Maternity Leave</div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 4 }}>100% paid benefit</div>
        </div>

        <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>45 Days</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>Max EL Carry-Forward</div>
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 4 }}>Surplus encashed per rules</div>
        </div>
      </div>

      {/* Step by Step Workflow Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          How to Apply on DSP PeoplePulse Portal
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              1
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Log into PeoplePulse HRMS</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Open <a href="https://peoplepulse.dspamc.com/leave" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontWeight: 600 }}>peoplepulse.dspamc.com</a> with your corporate Single Sign-On.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              2
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Navigate to Workspace & Select Leave Category</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Go to <strong>My Workspace &gt; Leave Management &gt; Apply Leave</strong>. Select Earned Leave, Casual Leave, or Sick Leave.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              3
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Handover Protocol & Advance Notice</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Leaves &gt; 3 consecutive business days require <strong>7 working days prior submission</strong> and appointment of a peer operational delegate.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              4
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>Manager Approval SLA</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Reporting Manager has a strict <strong>48-hour approval SLA</strong>. Unanswered requests escalate automatically after 72 hours.
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => navigate('/')}
          >
            <Sparkles style={{ width: 14, height: 14 }} /> Open KnowledgeHub AI
          </button>
          <a
            href="https://peoplepulse.dspamc.com/leave"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            Open PeoplePulse HRMS <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── 3. ONBOARDING & L&D PROCESS VIEW ────────────────────────────────

export function OnboardingProcessPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Sparkles style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          New Hire Onboarding Guide v3.4
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Document Ref: <strong>DSP-HR-002</strong> • Day 1 Induction, Buddy Program & NISM Certifications
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            📍 Day 1 Induction Protocol
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
            Report to DSPAMC Corporate Headquarters at <strong>One BKC (B-Wing, 10th Floor, BKC, Mumbai)</strong> at 09:30 IST. Collect your encrypted laptop, welcome kit, and complete biometric ID registration.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            🎓 Mandatory Regulatory Exams
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
            Advisors & Analysts must complete <strong>NISM-Series-V-A</strong> (Mutual Funds) or <strong>NISM-Series-XV</strong> (Research Analyst) within <strong>60 calendar days</strong>. Exam fees are 100% reimbursed.
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            🤝 Peer Buddy Assignment
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>
            Every joiner is assigned a department Peer Buddy for the first 90 days to assist with internal processes, culture navigation, and system familiarization.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Required Submissions Checklist (Within 15 Days)
        </h3>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.8 }}>
          <li>PF Nomination (EPFO Form 2 & Form 11) via PeoplePulse</li>
          <li>Gratuity Nomination (Payment of Gratuity Form F)</li>
          <li>Group Mediclaim Dependent Declaration (Spouse, Children, Parents)</li>
          <li>DSPAMC Code of Ethics & Insider Trading Declaration</li>
        </ul>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <Sparkles style={{ width: 14, height: 14 }} /> Ask KnowledgeHub AI about Onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 4. IT & IAM ACCESS PROCESS VIEW ─────────────────────────────────

export function ITAccessProcessPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Key style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          IT Access & IAM Standard Operating Procedure
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Document Ref: <strong>DSP-IT-001 (v5.1)</strong> • Enterprise Technology & Cyber Defense
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          Role-Based Access Request Steps (ServiceHub)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: '#334155' }}>
          <div><strong>Step 1:</strong> Access DSP ServiceHub at <a href="https://servicehub.dspamc.com/access-request" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9' }}>servicehub.dspamc.com</a>.</div>
          <div><strong>Step 2:</strong> Go to <strong>Service Catalog &gt; Identity & Access Management &gt; Application Access</strong>.</div>
          <div><strong>Step 3:</strong> Select application: Bloomberg Terminal, Refinitiv Eikon, Qdrant Vector Store, or Internal Repositories.</div>
          <div><strong>Step 4:</strong> Enter business rationale and specify permission tier (Read vs Read-Write).</div>
          <div><strong>Step 5:</strong> Line Manager approves &gt; InfoSec validates &gt; Provisioned within <strong>24 hours</strong>.</div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e40af', marginBottom: 4 }}>
            🔒 Remote VPN & MFA Mandate
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1e3a8a', lineHeight: 1.5 }}>
            Remote workers require Cisco AnyConnect / GlobalProtect VPN with Microsoft Authenticator push MFA. Passwords require min 14 characters and expire every 90 days.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 5. EXPENSE & TRAVEL PROCESS VIEW ────────────────────────────────

export function ExpenseProcessPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <CreditCard style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          Travel & Business Expense Policy 2026
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Document Ref: <strong>DSP-FIN-001 (v3.8)</strong> • Finance & Accounts
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #0ea5e9' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Submission Deadline</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>30 Calendar Days</div>
          <div style={{ fontSize: '0.6875rem', color: '#ef4444' }}>&gt;45 days requires CFO signoff</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Metro Lodging Cap</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>₹8,500 / night</div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Tier-1 metros (taxes incl.)</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Per Diem (Incidentals)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>₹1,800 / day</div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Tier-1 when meals not hosted</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          SAP Concur Submission & Invoicing Rules
        </h3>
        <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
          All business expenses must be filed on <strong>SAP Concur</strong> (expenses.dspamc.com). Every claim above ₹250 mandates a verifiable GST Tax Invoice addressed to <em>DSP Asset Managers Private Limited</em> with the relevant State GSTIN.
        </p>
      </div>
    </div>
  );
}

// ─── 6. COMPLIANCE & PERSONAL TRADING CODE VIEW ──────────────────────

export function ComplianceProcessPage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Scale style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          SEBI Compliance & Personal Trading Code 2026
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Document Ref: <strong>DSP-COMP-001 (v6.0)</strong> • SEBI (PIT) Regulations 2015
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Core Trading Restrictions for Access Persons
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: '#334155' }}>
          <div><strong>1. Mandatory Digital Pre-Clearance:</strong> Required for all equity transactions via DSP ComplianceDesk before execution.</div>
          <div><strong>2. 48-Hour Order Window:</strong> Orders must be executed within 48 hours of approval or they lapse automatically.</div>
          <div><strong>3. 30-Day Mandatory Holding Rule:</strong> Approved purchases cannot be sold for 30 calendar days. Intraday and F&amp;O trading are forbidden.</div>
          <div><strong>4. Restricted List (Grey List):</strong> System blocks pre-clearance on securities under active institutional research embargo.</div>
          <div><strong>5. Chinese Walls:</strong> Strict physical &amp; logical separation between Research/Dealing and Sales/Operations.</div>
        </div>
      </div>
    </div>
  );
}

// ─── 7. HR & IT DIRECTORY / HELPDESK VIEW ────────────────────────────

export function HelpDirectoryPage() {
  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <HelpCircle style={{ width: 24, height: 24, color: '#0ea5e9' }} />
          DSPAMC Employee Helpdesk & System Directory
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '0.25rem' }}>
          Internal departmental points of contact, system URLs, and escalation contacts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>PeoplePulse HRMS</div>
          <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>https://peoplepulse.dspamc.com</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Leave requests, Mediclaim, salary slips, statutory nominations</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>ServiceHub IT Desk</div>
          <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>https://servicehub.dspamc.com</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Software access, VPN tokens, Bloomberg terminals, hardware tickets</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>SAP Concur Expenses</div>
          <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>https://expenses.dspamc.com</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Travel claims, hotel bills, conveyance reimbursements</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>ComplianceDesk</div>
          <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>https://compliance.dspamc.com</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Personal trade pre-clearance, grey list checks, code of conduct</div>
        </div>
      </div>
    </div>
  );
}
