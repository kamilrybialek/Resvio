'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase/client';

// ─────────────────────────────────────────────
// Inline SVG icons — no extra dependency
// ─────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

function ResvioLogo() {
  return (
    <span style={{ fontWeight: 900, fontSize: '1.7rem', letterSpacing: '-0.04em' }}>
      Res
      <span style={{
        background: 'var(--gradient-brand)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        vio
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

type Tab = 'signin' | 'register';

export default function AuthPage() {
  const router = useRouter();

  const [tab, setTab]           = useState<Tab>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Reset error when the user switches tabs
  useEffect(() => { setError(null); }, [tab]);

  // ── Persist session cookie then redirect ──
  async function persistSession(credential: UserCredential) {
    const idToken = await credential.user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error ?? 'Failed to create session');
    }
  }

  // ── Email / password submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const auth = getClientAuth();
      let credential: UserCredential;

      if (tab === 'signin') {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      }

      await persistSession(credential);
      router.push('/');
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Google sign-in ──
  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const auth      = getClientAuth();
      const provider  = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await persistSession(credential);
      router.push('/');
    } catch (err: unknown) {
      // User closed the popup — silently ignore
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setError(friendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <>
      <style>{`
        .auth-bg {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-base);
          padding: 24px 16px 48px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--r-xl);
          padding: 36px 32px 32px;
          box-shadow: var(--shadow-lg);
          animation: fadeInUp 0.35s var(--ease-out) both;
        }

        @media (max-width: 480px) {
          .auth-card { padding: 28px 20px 24px; border-radius: var(--r-lg); }
        }

        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .auth-tabs {
          display: flex;
          background: var(--bg-surface);
          border: 1px solid var(--border-dim);
          border-radius: var(--r-full);
          padding: 3px;
          margin-bottom: 28px;
          gap: 2px;
        }

        .auth-tab {
          flex: 1;
          padding: 8px 12px;
          border-radius: var(--r-full);
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
        }

        .auth-tab.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 10px rgba(99,102,241,0.35);
        }

        .auth-tab:not(.active):hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .auth-label {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--r-md);
          color: var(--text-primary);
          font-size: var(--text-base);
          font-family: var(--font-sans);
          outline: none;
          transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
        }
        .auth-input::placeholder { color: var(--text-tertiary); }
        .auth-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-dim);
        }

        .auth-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--r-md);
          padding: 10px 14px;
          font-size: var(--text-sm);
          color: var(--text-danger);
          margin-bottom: 16px;
          animation: fadeIn 0.2s ease both;
        }

        .auth-submit {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border-radius: var(--r-full);
          border: none;
          background: var(--gradient-primary);
          color: #fff;
          font-size: var(--text-base);
          font-weight: 700;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all var(--duration-base) var(--ease-out);
          box-shadow: 0 4px 16px rgba(99,102,241,0.30);
          letter-spacing: 0.01em;
          margin-top: 4px;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.45);
        }
        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-dim);
        }

        .auth-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0.72rem 1.5rem;
          border-radius: var(--r-full);
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
        }
        .auth-google:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-bright);
        }
        .auth-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          line-height: 1.6;
        }
      `}</style>

      <div className="auth-bg">
        {/* Logo */}
        <div className="auth-logo" style={{ marginBottom: '24px' }}>
          <ResvioLogo />
        </div>

        <div className="auth-card">
          {/* Tagline */}
          <p style={{
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}>
            Your AI-powered job search assistant
          </p>

          {/* Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              role="tab"
              aria-selected={tab === 'signin'}
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={tab === 'register'}
              className={`auth-tab${tab === 'register' ? ' active' : ''}`}
              onClick={() => setTab('register')}
            >
              Create Account
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {/* Email / password form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="auth-email" className="auth-label">Email</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading || googleLoading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password" className="auth-label">Password</label>
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                required
                disabled={loading || googleLoading}
              />
            </div>

            {tab === 'register' && (
              <div className="auth-field">
                <label htmlFor="auth-confirm" className="auth-label">Confirm Password</label>
                <input
                  id="auth-confirm"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading || googleLoading}
                />
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || googleLoading || !email || !password}
            >
              {loading
                ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                : (tab === 'signin' ? 'Sign In'    : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">or</div>

          {/* Google */}
          <button
            type="button"
            className="auth-google"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            aria-label="Continue with Google"
          >
            <GoogleIcon />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>
        </div>

        {/* Footer */}
        <p className="auth-footer">
          By continuing, you agree to Resvio&apos;s terms of service.
          <br />
          Your data is encrypted and never shared.
        </p>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Utility: convert Firebase error codes to
// human-readable messages.
// ─────────────────────────────────────────────
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const msg  = (err as { message?: string })?.message ?? 'An unexpected error occurred.';

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    default:
      return msg;
  }
}
