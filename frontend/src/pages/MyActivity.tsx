import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  CreditCard,
  LifeBuoy,
  ChevronRight,
  Filter
} from 'lucide-react';
import { selfServiceAPI } from '../services/api';

export default function MyActivity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    loadActivityFeed();
  }, []);

  const loadActivityFeed = async () => {
    try {
      setLoading(true);
      const res = await selfServiceAPI.getActivityFeed();
      if (res.data?.success && res.data.data) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load activity feed', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterType === 'ALL'
    ? activities
    : activities.filter((a) => a.type === filterType);

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-avatar-pulsing" />
        <p>Loading activity audit trail...</p>
      </div>
    );
  }

  return (
    <div className="self-service-page-container">
      {/* ─── PAGE HEADER ────────────────────────────────────────────── */}
      <div className="page-header-row">
        <div>
          <div className="page-meta-badge">
            <Clock style={{ width: 12, height: 12, color: '#0D9488' }} />
            <span>CHRONOLOGICAL AUDIT TIMELINE</span>
          </div>
          <h1 className="page-title">My Activity &amp; Status Feed</h1>
          <p className="page-subtext">
            Consolidated history of all your submitted leave applications, expense claims, and service desk interactions.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="filter-chips-row">
          {['ALL', 'LEAVE', 'EXPENSE', 'SERVICE_DESK'].map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-chip ${filterType === type ? 'is-active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TIMELINE STREAM ────────────────────────────────────────── */}
      <div className="activity-timeline-stream">
        {filtered.length === 0 ? (
          <div className="empty-table-hint">
            <Clock style={{ width: 32, height: 32, color: '#94A3B8', margin: '0 auto 0.5rem' }} />
            <p>No activity records matching filter.</p>
          </div>
        ) : (
          filtered.map((act) => (
            <div
              key={act.id}
              className="timeline-card-row"
              onClick={() => navigate(act.link || '/')}
            >
              <div className={`timeline-icon-box type-${act.type.toLowerCase()}`}>
                {act.type === 'LEAVE' ? (
                  <Calendar style={{ width: 16, height: 16 }} />
                ) : act.type === 'EXPENSE' ? (
                  <CreditCard style={{ width: 16, height: 16 }} />
                ) : (
                  <LifeBuoy style={{ width: 16, height: 16 }} />
                )}
              </div>

              <div className="timeline-card-content">
                <div className="timeline-title-row">
                  <div className="title-left">
                    <span className="timeline-ref">{act.reference}</span>
                    <h4 className="timeline-title">{act.title}</h4>
                  </div>
                  <span className={`status-pill status-${act.status.toLowerCase()}`}>
                    {act.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="timeline-subtitle">{act.subtitle}</p>

                <div className="timeline-time-row">
                  <Clock style={{ width: 12, height: 12, color: '#94A3B8' }} />
                  <span>{new Date(act.timestamp).toLocaleString()}</span>
                  <span className="timeline-link-hint">
                    View details <ChevronRight style={{ width: 12, height: 12 }} />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
