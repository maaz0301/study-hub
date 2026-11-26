import { randomUUID } from 'node:crypto';
import { authConfigured, hashPassword, setSession, type User } from '@/lib/auth';
import { getDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!authConfigured()) return Response.json({ error: 'Accounts are not set up on this server yet.' }, { status: 503 });
  const b = await req.json().catch(() => null);
  const email = String(b?.email || '').trim().toLowerCase();
  const password = String(b?.password || '');
  const name = String(b?.name || '').trim().slice(0, 60) || email.split('@')[0];
  if (!EMAIL.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8 || password.length > 200) return Response.json({ error: 'Password must be 8 to 200 characters.' }, { status: 400 });
  try {
    const db = await getDb();
    const users = db!.collection<User>('users');
    await users.createIndex({ email: 1 }, { unique: true });
    const { salt, hash } = await hashPassword(password);
    const user: User = { _id: randomUUID(), email, name, salt, hash, createdAt: new Date() };
    try {
      await users.insertOne(user);
    } catch (e) {
      if ((e as { code?: number }).code === 11000) return Response.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });
      throw e;
    }
    await setSession(user._id);
    return Response.json({ user: { email, name } });
  } catch {
    return Response.json({ error: 'Database error, try again.' }, { status: 502 });
  }
}
