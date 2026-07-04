import React, { useEffect, useState, useCallback } from 'react';
import { api, authApi, getToken, setToken } from './api';
import SummaryStrip from './components/SummaryStrip.jsx';
import Filters from './components/Filters.jsx';
import ItemCard from './components/ItemCard.jsx';
import ItemFormModal from './components/ItemFormModal.jsx';
import AuthForm from './components/AuthForm.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ payers: [], platforms: [] });
  const [summary, setSummary] = useState({});
  const [payer, setPayer] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | itemObject for edit

  // On first load, validate any stored token against the backend
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  // If any API call comes back 401, drop back to the login screen
  useEffect(() => {
    function handleLogout() {
      setUser(null);
    }
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  function handleLogoutClick() {
    setToken(null);
    setUser(null);
  }

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const filterParams = {};
      if (payer !== 'all') filterParams.payer = payer;
      if (platform !== 'all') filterParams.platform = platform;

      const [itemsRes, metaRes, summaryRes] = await Promise.all([
        api.getItems(filterParams),
        api.getMeta(),
        api.getSummary(filterParams),
      ]);
      setItems(itemsRes);
      setMeta(metaRes);
      setSummary(summaryRes);
    } catch (err) {
      setError(err.message || 'Failed to load data. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  }, [payer, platform, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFilterChange({ payer: p, platform: pl }) {
    setPayer(p);
    setPlatform(pl);
  }

  function clearFilters() {
    setPayer('all');
    setPlatform('all');
  }

  async function handleAdd(payload) {
    await api.createItem(payload);
    setModalMode(null);
    await loadData();
  }

  async function handleEditSubmit(payload) {
    await api.updateItem(modalMode._id, payload);
    setModalMode(null);
    await loadData();
  }

  async function handlePay(item) {
    try {
      await api.payMonth(item._id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnpay(item) {
    try {
      await api.unpayMonth(item._id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.itemName}" from the tracker?`)) return;
    try {
      await api.deleteItem(item._id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (checkingSession) {
    return <div className="loading full-screen">Loading…</div>;
  }

  if (!user) {
    return <AuthForm onAuthenticated={(u) => setUser(u)} />;
  }

  return (
    <div className="app">
      <div className="masthead">
        <div>
          <h1>
            <span>Ledgrr</span> — Payoff Tracker
          </h1>
          <div className="tagline">
            Signed in as {user.name} · <button className="link-btn" onClick={handleLogoutClick}>Log out</button>
          </div>
        </div>
        <button className="btn-add" onClick={() => setModalMode('add')}>
          + Add item
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <SummaryStrip summary={summary} />

      <Filters
        payers={meta.payers}
        platforms={meta.platforms}
        payer={payer}
        platform={platform}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {loading ? (
        <div className="loading">Loading items…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          {payer !== 'all' || platform !== 'all'
            ? 'No items match this filter. Try clearing it, or add a new item.'
            : 'Nothing tracked yet. Add your first BNPL or installment item to get started.'}
        </div>
      ) : (
        <div className="item-grid">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onPay={handlePay}
              onUnpay={handleUnpay}
              onEdit={(it) => setModalMode(it)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modalMode === 'add' && <ItemFormModal onSubmit={handleAdd} onClose={() => setModalMode(null)} />}
      {modalMode && modalMode !== 'add' && (
        <ItemFormModal initialItem={modalMode} onSubmit={handleEditSubmit} onClose={() => setModalMode(null)} />
      )}
    </div>
  );
}
