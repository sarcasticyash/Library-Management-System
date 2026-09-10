import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface StationSummaryCardProps {
  holdingsCount?: number;
  activeLoansCount?: number;
  overdueCount?: number;
}

export const StationSummaryCard: React.FC<StationSummaryCardProps> = ({
  holdingsCount = 125,
  activeLoansCount = 11,
  overdueCount = 0,
}) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // 7 days of circulation volume distribution
  const circulationBars = [
    { day: 'Mon', height: 14, val: 42 },
    { day: 'Tue', height: 20, val: 68 },
    { day: 'Wed', height: 16, val: 54 },
    { day: 'Thu', height: 26, val: 89, active: true },
    { day: 'Fri', height: 22, val: 75 },
    { day: 'Sat', height: 18, val: 61 },
    { day: 'Sun', height: 10, val: 34 },
  ];

  return (
    <div className="station-ticket-container" aria-label="Library Archive Station Summary Ticket">
      <div className="station-ticket-card">
        {/* Header Station Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="station-header-label">COLLECTION SUMMARY</div>
            <div className="station-station-no">Station No. 042-B</div>
          </div>
          <div
            title="Real-time synchronized"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '2px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              fontSize: '9px',
              fontFamily: 'var(--font-family-mono)',
              fontWeight: 700,
            }}
          >
            <Activity size={10} />
            <span>ONLINE</span>
          </div>
        </div>

        <div className="ticket-divider-dashed" />

        {/* Metric 1: Total Holdings */}
        <div className="ticket-metric-block">
          <div className="ticket-metric-label">TOTAL HOLDINGS</div>
          <div className="ticket-metric-huge">{holdingsCount.toLocaleString()}</div>
        </div>

        {/* Metric 2: Out on Loan */}
        <div className="ticket-metric-block">
          <div className="ticket-metric-label">OUT ON LOAN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '28px',
                fontWeight: 800,
                color: '#ff5500',
                lineHeight: 1,
              }}
            >
              {activeLoansCount}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '10px',
                color: '#78716c',
                fontWeight: 600,
              }}
            >
              / ACTIVE
            </span>
          </div>
        </div>

        {/* Metric 3: Overdue Urgent */}
        <div className="ticket-metric-block" style={{ marginBottom: '8px' }}>
          <div className="ticket-metric-label">OVERDUE</div>
          <div className="ticket-metric-urgent">
            <span>{overdueCount < 10 ? `0${overdueCount}` : overdueCount}</span>
            <span className="ticket-urgent-stamp">URGENT</span>
          </div>
        </div>

        {/* Weekly Circulation Histogram Bar Chart */}
        <div
          className="ticket-histogram"
          role="img"
          aria-label="Weekly circulation volume bar chart"
        >
          {circulationBars.map((bar, idx) => (
            <div
              key={bar.day}
              className={`ticket-bar ${bar.active ? 'active' : ''}`}
              style={{
                height: `${bar.height}px`,
                cursor: 'pointer',
                transform: hoveredBarIndex === idx ? 'scaleY(1.15)' : 'none',
              }}
              onMouseEnter={() => setHoveredBarIndex(idx)}
              onMouseLeave={() => setHoveredBarIndex(null)}
              title={`${bar.day}: ${bar.val} checkouts`}
            />
          ))}
        </div>
        <div className="ticket-histogram-label">
          {hoveredBarIndex !== null && circulationBars[hoveredBarIndex]
            ? `${circulationBars[hoveredBarIndex]?.day}: ${circulationBars[hoveredBarIndex]?.val} loans`
            : 'WEEKLY CIRCULATION VOLUME'}
        </div>
      </div>
    </div>
  );
};
