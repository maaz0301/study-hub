'use client';
import { useSyncExternalStore } from 'react';

/* Lesson progress + account.
   Progress is saved in this browser at once (localStorage) and synced to MongoDB through /api/progress:
   under the account when logged in, otherwise under an anonymous device code. */
const DEV_KEY = 'study-hub-device';
const DONE_KEY = 'study-hub-done';

type Sync = 'off' | 'syncing' | 'ok' | 'local';
export type AccountUser = { email: string; name: string } | null;
type Snap = { done: Set<string>; synced: Sync; user: AccountUser; ready: boolean; configured: boolean };

let done = new Set<string>();
let device = '';
let loaded = false;
let synced: Sync = 'off';
let user: AccountUser = null;
let ready = false;
let configured = true;
const subs = new Set<() => void>();
const EMPTY: Snap = { done: new Set(), synced: 'off', user: null, ready: false, configured: true };
let snapshot: Snap = EMPTY;

const emit = () => { snapshot = { done: new Set(done), synced, user, ready, configured }; subs.forEach((f) => f()); };
const safe = <T,>(f: () => T, d: T): T => { try { return f(); } catch { return d; } };
const persist = () => safe(() => localStorage.setItem(DONE_KEY, JSON.stringify([...done])), undefined);
const post = (body: object) => fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device, ...body }) });

function uuid() {
  return safe(() => crypto.randomUUID(), 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));
}

export function getDevice() { init(); return device; }

export async function restoreDevice(code: string) {
  if (!/^[0-9a-f-]{36}$/.test(code)) return false;
  device = code;
  safe(() => localStorage.setItem(DEV_KEY, code), undefined);
  await pull();
  return true;
}

/** Merge remote + local progress: anything done in either place counts. */
async function pull() {
  synced = 'syncing'; emit();
  try {
    const r = await fetch(`/api/progress?device=${device}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const remote: string[] = (await r.json()).done || [];
    const localOnly = [...done].filter((k) => !remote.includes(k));
    remote.forEach((k) => done.add(k));
    persist();
    if (localOnly.length) await post({ add: localOnly });
    synced = 'ok';
  } catch { synced = 'local'; }
  emit();
}

async function loadUser() {
  try {
    const j = await (await fetch('/api/auth/me', { cache: 'no-store' })).json();
    user = j.user; configured = j.configured !== false;
  } catch { user = null; }
  ready = true;
}

function init() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  device = safe(() => localStorage.getItem(DEV_KEY) || '', '');
  if (!device) { device = uuid(); safe(() => localStorage.setItem(DEV_KEY, device), undefined); }
  done = new Set(safe(() => JSON.parse(localStorage.getItem(DONE_KEY) || '[]') as string[], []));
  emit();
  loadUser().then(() => { emit(); return pull(); });
}

export async function setDone(key: string, value: boolean) {
  init();
  if (value) done.add(key); else done.delete(key);
  persist(); emit();
  try { synced = (await post(value ? { add: [key] } : { remove: [key] })).ok ? 'ok' : 'local'; } catch { synced = 'local'; }
  emit();
}

/** Sign up or log in. Progress made before logging in is merged into the account. */
export async function authenticate(mode: 'login' | 'signup', email: string, password: string, name?: string): Promise<string | null> {
  init();
  try {
    const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) });
    const j = await r.json();
    if (!r.ok) return j.error || 'Something went wrong.';
    user = j.user; ready = true; emit();
    await pull();
    return null;
  } catch { return 'Network error, try again.'; }
}

export async function logout() {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
  user = null;
  // do not leave the account's progress behind for the next person on this device
  done = new Set(); persist();
  device = uuid(); safe(() => localStorage.setItem(DEV_KEY, device), undefined);
  synced = 'off'; emit();
}

export function useProgress(): Snap {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); init(); return () => { subs.delete(cb); }; },
    () => snapshot,
    () => EMPTY,
  );
}
