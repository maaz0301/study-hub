import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { Topic, TopicSummary } from './types';

const DIR = path.join(process.cwd(), 'src', 'content', 'generated');

export const getIndex = cache((): TopicSummary[] => {
  return JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
});

export const getTopic = cache((slug: string): Topic | null => {
  const file = path.join(DIR, 'topics', `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
});

export function categories(index: TopicSummary[]) {
  const map = new Map<string, TopicSummary[]>();
  for (const t of index) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return [...map.entries()];
}
