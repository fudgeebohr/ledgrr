import React from 'react';

function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ItemCard({ item, onPay, onUnpay, onEdit, onDelete }) {
  const ticks = Array.from({ length: item.monthsToPay }, (_, i) => i < item.monthsPaid);

  return (
    <div className="item-card">
      <div className="item-main">
        <div className="name-row">
          <span className="item-name">{item.itemName}</span>
          <span className="platform-tag">{item.platform}</span>
        </div>
        <div className="meta-row">
          <span>
            Payer: <b>{item.payer}</b>
          </span>
          <span>
            Next due: <b>{formatDate(item.dueDate)}</b>
          </span>
          <span>
            Month <b>{item.monthsPaid}</b> of <b>{item.monthsToPay}</b>
          </span>
        </div>
        <div className="tape" aria-label={`${item.monthsPaid} of ${item.monthsToPay} months paid`}>
          {ticks.map((paid, i) => (
            <span key={i} className={`tick ${paid ? 'paid' : ''}`} />
          ))}
        </div>
      </div>

      <div className="item-amounts">
        <div className="monthly">{formatMoney(item.monthlyDue)}/mo</div>
        <div className="remaining">{formatMoney(item.remainingAmount)} remaining</div>
      </div>

      <div className="item-actions">
        <button className="btn-pay" onClick={() => onPay(item)}>
          Mark month paid
        </button>
        <button className="btn-secondary" onClick={() => onEdit(item)}>
          Edit
        </button>
        {item.monthsPaid > 0 && (
          <button className="btn-secondary" onClick={() => onUnpay(item)}>
            Undo last payment
          </button>
        )}
        <button className="btn-secondary btn-remove" onClick={() => onDelete(item)}>
          Remove
        </button>
      </div>
    </div>
  );
}
