'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authenticate, useProgress } from '@/lib/progress';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('next') || '/';
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  const { user, ready, configured } = useProgress();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const err = await authenticate(mode, email, password, name);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <form onSubmit={submit} className="panel" style={{ width: 'min(100%, 420px)', padding: 26, display: 'grid', gap: 14 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 850, letterSpacing: '-0.02em' }}>{mode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>Your lesson progress is saved to your account and follows you on every device.</p>
      </div>
      {ready && !configured && <div className="about-box" style={{ fontSize: 13.5 }}>Accounts are not switched on for this site yet. Your progress is still saved in this browser.</div>}
      {mode === 'signup' && (
        <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 650 }}>Name (optional)
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} />
        </label>
      )}
      <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 650 }}>Email
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 650 }}>Password {mode === 'signup' && <span className="faint" style={{ fontWeight: 500 }}>(at least 8 characters)</span>}
        <input className="input" type="password" required minLength={mode === 'signup' ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      </label>
      {error && <div role="alert" style={{ color: '#ef4444', fontSize: 13.5 }}>{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy || !configured}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <div style={{ fontSize: 13.5, textAlign: 'center' }} className="muted">
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <button type="button" className="pg-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Log in'}</button>
      </div>
    </form>
  );
}
