'use client';
import { useSyncExternalStore } from 'react';

/** Learning progress kept in this browser (localStorage). */
type State = {
  done: Record<string, 1>; // "topic/part/section"
  cards: Record<string, { box: number; seen: number }>; // Leitner boxes 0..4
  quiz: Record<string, { best: number; total: number }>;
};

const KEY = 'study-hub-progress-v1';
const empty: State = { done: {}, cards: {}, quiz: {} };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: progress lives in memory only */
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const progress = {
  get: () => {
    load();
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        loaded = false;
        state = empty;
        load();
        l();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener('storage', onStorage);
    };
  },
  toggleDone(key: string, value?: boolean) {
    load();
    const done = { ...state.done };
    const on = value ?? !done[key];
    if (on) done[key] = 1;
    else delete done[key];
    state = { ...state, done };
    save();
  },
  markMany(keys: string[], on: boolean) {
    load();
    const done = { ...state.done };
    for (const k of keys) {
      if (on) done[k] = 1;
      else delete done[k];
    }
    state = { ...state, done };
    save();
  },
  rateCard(id: string, knew: boolean) {
    load();
    const prev = state.cards[id] || { box: 0, seen: 0 };
    const box = knew ? Math.min(4, prev.box + 1) : 0;
    state = { ...state, cards: { ...state.cards, [id]: { box, seen: prev.seen + 1 } } };
    save();
  },
  saveQuiz(slug: string, score: number, total: number) {
    load();
    const prev = state.quiz[slug];
    const best = prev && prev.total === total ? Math.max(prev.best, score) : score;
    state = { ...state, quiz: { ...state.quiz, [slug]: { best, total } } };
    save();
  },
  reset() {
    state = { done: {}, cards: {}, quiz: {} };
    save();
  },
};

export function useProgress(): State {
  return useSyncExternalStore(progress.subscribe, progress.get, () => empty);
}

export function countDone(p: State, prefix: string) {
  let n = 0;
  for (const k in p.done) if (k.startsWith(prefix)) n++;
  return n;
}
