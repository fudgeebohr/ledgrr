import React from 'react';

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export default function SummaryStrip({ summary }) {
  return (
    <div className="summary-strip">
      <div className="summary-cell accent">
        <div className="label">Total monthly due</div>
        <div className="value">{formatMoney(summary.totalMonthlyDue)}</div>
      </div>
      <div className="summary-cell">
        <div className="label">Remaining balance</div>
        <div className="value">{formatMoney(summary.totalRemaining)}</div>
      </div>
      <div className="summary-cell">
        <div className="label">Paid so far</div>
        <div className="value">{formatMoney(summary.totalPaid)}</div>
      </div>
      <div className="summary-cell">
        <div className="label">Active items</div>
        <div className="value">{summary.totalOutstandingItems || 0}</div>
      </div>
    </div>
  );
}
