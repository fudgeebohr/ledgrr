import React, { useState } from 'react';

const emptyForm = {
  itemName: '',
  payer: '',
  platform: '',
  monthlyDue: '',
  monthsToPay: '',
  monthsPaid: '',
  dueDate: '',
  notes: '',
};

function toDateInputValue(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

export default function ItemFormModal({ initialItem, onSubmit, onClose }) {
  const isEdit = Boolean(initialItem);
  const [form, setForm] = useState(
    initialItem
      ? {
          itemName: initialItem.itemName,
          payer: initialItem.payer,
          platform: initialItem.platform,
          monthlyDue: initialItem.monthlyDue,
          monthsToPay: initialItem.monthsToPay,
          monthsPaid: initialItem.monthsPaid,
          dueDate: toDateInputValue(initialItem.dueDate),
          notes: initialItem.notes || '',
        }
      : emptyForm
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.itemName || !form.payer || !form.platform || !form.monthlyDue || !form.monthsToPay || !form.dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = {
      itemName: form.itemName.trim(),
      payer: form.payer.trim(),
      platform: form.platform.trim(),
      monthlyDue: Number(form.monthlyDue),
      monthsToPay: Number(form.monthsToPay),
      dueDate: form.dueDate,
      notes: form.notes.trim(),
    };

    if (isEdit) {
      payload.monthsPaid = Number(form.monthsPaid) || 0;
    }

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit item' : 'Add a new item'}</h2>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="itemName">Item name</label>
            <input
              id="itemName"
              type="text"
              placeholder="e.g. iPhone 15 (Home Credit)"
              value={form.itemName}
              onChange={(e) => update('itemName', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="payer">Payer</label>
              <input
                id="payer"
                type="text"
                placeholder="e.g. Mia"
                value={form.payer}
                onChange={(e) => update('payer', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="platform">Platform</label>
              <input
                id="platform"
                type="text"
                placeholder="e.g. GCash, Home Credit"
                value={form.platform}
                onChange={(e) => update('platform', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="monthlyDue">Monthly due</label>
              <input
                id="monthlyDue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.monthlyDue}
                onChange={(e) => update('monthlyDue', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="monthsToPay">Months to pay</label>
              <input
                id="monthsToPay"
                type="number"
                min="1"
                placeholder="e.g. 6"
                value={form.monthsToPay}
                onChange={(e) => update('monthsToPay', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="dueDate">{isEdit ? 'Next due date' : 'First due date'}</label>
              <input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
              />
            </div>
            {isEdit && (
              <div className="form-field">
                <label htmlFor="monthsPaid">Months paid</label>
                <input
                  id="monthsPaid"
                  type="number"
                  min="0"
                  value={form.monthsPaid}
                  onChange={(e) => update('monthsPaid', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="notes">Notes (optional)</label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. shared with roommate"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
