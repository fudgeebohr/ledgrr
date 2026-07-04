import React, { useState } from 'react';
import { authApi, setToken } from '../api';

export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || (mode === 'register' && !form.name)) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload =
        mode === 'register'
          ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
          : { email: form.email.trim(), password: form.password };

      const { token, user } = mode === 'register' ? await authApi.register(payload) : await authApi.login(payload);

      setToken(token);
      onAuthenticated(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>
            <span>Ledgrr</span>
          </h1>
          <div className="tagline">Buy now, pay now, track it here</div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          <button type="submit" className="btn-submit auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button type="button" onClick={toggleMode}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={toggleMode}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
