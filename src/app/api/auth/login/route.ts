import { authConfigured, checkPassword, setSession, type User } from '@/lib/auth';
import { getDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!authConfigured()) return Response.json({ error: 'Accounts are not set up on this server yet.' }, { status: 503 });
  const b = await req.json().catch(() => null);
  const email = String(b?.email || '').trim().toLowerCase();
  const password = String(b?.password || '');
  try {
    const db = await getDb();
    const user = await db!.collection<User>('users').findOne({ email });
    // one message for an unknown email and for a wrong password
    if (!user || !(await checkPassword(password, user.salt, user.hash))) return Response.json({ error: 'Wrong email or password.' }, { status: 401 });
    await setSession(user._id);
    return Response.json({ user: { email: user.email, name: user.name } });
  } catch {
    return Response.json({ error: 'Database error, try again.' }, { status: 502 });
  }
}
