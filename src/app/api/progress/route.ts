import { sessionUid } from '@/lib/auth';
import { getDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

const ID = /^[0-9a-f-]{36}$/;
const KEY = /^[a-z0-9-]{1,40}:\d{1,4}$/;
type Doc = { _id: string; done: string[]; updatedAt: Date };

/** Logged-in users are stored under their account, anonymous visitors under their device code. */
async function owner(device: unknown) {
  const uid = await sessionUid();
  if (uid) return `u:${uid}`;
  return typeof device === 'string' && ID.test(device) ? `d:${device}` : null;
}
const clean = (v: unknown) => (Array.isArray(v) ? v.filter((k): k is string => typeof k === 'string' && KEY.test(k)).slice(0, 500) : []);

export async function GET(req: Request) {
  const id = await owner(new URL(req.url).searchParams.get('device'));
  if (!id) return Response.json({ error: 'bad device' }, { status: 400 });
  try {
    const db = await getDb();
    if (!db) return Response.json({ error: 'database not configured' }, { status: 503 });
    const doc = await db.collection<Doc>('progress').findOne({ _id: id });
    return Response.json({ done: doc?.done ?? [] });
  } catch {
    return Response.json({ error: 'database error' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = await owner(body?.device);
  if (!id) return Response.json({ error: 'bad device' }, { status: 400 });
  const add = clean(body.add), remove = clean(body.remove);
  try {
    const db = await getDb();
    if (!db) return Response.json({ error: 'database not configured' }, { status: 503 });
    const c = db.collection<Doc>('progress');
    if (add.length) await c.updateOne({ _id: id }, { $addToSet: { done: { $each: add } }, $set: { updatedAt: new Date() } }, { upsert: true });
    if (remove.length) await c.updateOne({ _id: id }, { $pull: { done: { $in: remove } }, $set: { updatedAt: new Date() } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'database error' }, { status: 502 });
  }
}
