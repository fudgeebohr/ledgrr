import React from 'react';

export default function Filters({ payers, platforms, payer, platform, onChange, onClear }) {
  const hasFilter = payer !== 'all' || platform !== 'all';

  return (
    <div className="filters">
      <span className="filter-label">Payer</span>
      <select value={payer} onChange={(e) => onChange({ payer: e.target.value, platform })}>
        <option value="all">Everyone</option>
        {payers.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <span className="filter-label">Platform</span>
      <select value={platform} onChange={(e) => onChange({ payer, platform: e.target.value })}>
        <option value="all">All platforms</option>
        {platforms.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button className="clear-btn" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
