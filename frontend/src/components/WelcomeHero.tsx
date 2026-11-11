import React, { Suspense, lazy } from 'react';
import {
  Calendar,
  Sparkles,
  Key,
  CreditCard,
  Scale,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import KnowledgeCoreCSSFallback from './KnowledgeCoreCSSFallback';
import DspLogo from './DspLogo';

// Lazy-load 3D Core
const KnowledgeCore3D = lazy(() => import('./KnowledgeCore3D'));

interface WelcomeHeroProps {
  onSelectPrompt: (promptText: string) => void;
  coreState?: 'idle' | 'processing' | 'answered';
}

const SUGGESTED_PROMPT_CARDS = [
  {
    id: 'leave',
    icon: Calendar,
    category: 'Leave & Attendance',
    title: 'How do I apply for leave?',
    subtitle: 'Privilege, sick, casual leave quotas and PeoplePulse portal steps.',
    query: 'How do I apply for leave on the PeoplePulse portal and what are the annual entitlements?',
  },
  {
    id: 'onboarding',
    icon: Sparkles,
    category: 'New Hires',
    title: 'Employee onboarding roadmap',
    subtitle: 'Day 1 to 30 milestones, L&D mandatory courses, and buddy program.',
    query: 'Where can I find the new hire onboarding roadmap and what are the Day 1 to 30 milestones?',
  },
  {
    id: 'it-access',
    icon: Key,
    category: 'IT & IAM',
    title: 'Requesting IT and system access',
    subtitle: 'Bloomberg terminals, internal databases, VPN tokens, and approvals.',
    query: 'How do I request IT access to Bloomberg terminals, production databases, or VPN?',
  },
  {
    id: 'expenses',
    icon: CreditCard,
    category: 'Travel & Expenses',
    title: 'Expense claim procedures',
    subtitle: 'SAP Concur workflows, domestic travel limits, and approval SLAs.',
    query: 'What is the process for submitting an expense claim on SAP Concur and what are the per diem limits?',
  },
  {
    id: 'compliance',
    icon: Scale,
    category: 'SEBI Compliance',
    title: 'Personal trading pre-clearance',
    subtitle: 'Gray-list restrictions, blackout windows, and Compliance approval rules.',
    query: 'Where can I find the personal securities trading pre-clearance rules and blackout window policies?',
  },
];

export default function WelcomeHero({
  onSelectPrompt,
  coreState = 'idle',
}: WelcomeHeroProps) {
  return (
    <div className="welcome-hero-container">
      {/* Top 2-Column Hero: Left Typography & Right 3D Visual */}
      <div className="welcome-hero-grid">
        <div className="welcome-hero-left">
          <div className="welcome-badge">
            <DspLogo variant="card" size={18} style={{ marginRight: 4 }} />
            <span className="badge-text">DSP ASSET MANAGEMENT • INTERNAL ASSISTANT</span>
          </div>

          <h1 className="welcome-headline">
            Your knowledge, <br className="hide-on-mobile" />
            <span className="headline-gradient">one conversation away.</span>
          </h1>

          <p className="welcome-subheadline">
            Ask questions, discover internal guidance, and find the documents you need — all in one place.
          </p>

          <div className="welcome-trust-row">
            <div className="trust-pill">
              <ShieldCheck style={{ width: 13, height: 13, color: '#12B8A6' }} />
              <span>Grounded in DSPAMC Policies</span>
            </div>
            <div className="trust-pill">
              <BookOpen style={{ width: 13, height: 13, color: '#38BDF8' }} />
              <span>Direct Verbatim Citations</span>
            </div>
          </div>
        </div>

        <div className="welcome-hero-right">
          <div className="welcome-3d-pedestal">
            <div className="welcome-pedestal-glow" />
            <Suspense fallback={<KnowledgeCoreCSSFallback state={coreState} size="md" />}>
              <KnowledgeCore3D state={coreState} size="md" interactive={true} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Suggested Question Prompt Cards */}
      <div className="welcome-prompts-section">
        <div className="prompts-section-heading">
          <span>FREQUENT EMPLOYEE QUESTIONS</span>
        </div>

        <div className="suggested-prompts-grid">
          {SUGGESTED_PROMPT_CARDS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="prompt-card-btn"
              onClick={() => onSelectPrompt(item.query)}
            >
              <div className="prompt-card-icon-wrapper">
                <item.icon style={{ width: 16, height: 16 }} />
              </div>
              <div className="prompt-card-content">
                <div className="prompt-card-meta">{item.category}</div>
                <div className="prompt-card-title">{item.title}</div>
                <div className="prompt-card-subtitle">{item.subtitle}</div>
              </div>
              <div className="prompt-card-arrow">
                <ChevronRight style={{ width: 14, height: 14 }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
