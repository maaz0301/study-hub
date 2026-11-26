import { authConfigured, sessionUid, type User } from '@/lib/auth';
import { getDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = authConfigured();
  const uid = configured ? await sessionUid() : null;
  if (!uid) return Response.json({ user: null, configured });
  try {
    const u = await (await getDb())!.collection<User>('users').findOne({ _id: uid }, { projection: { email: 1, name: 1 } });
    return Response.json({ user: u ? { email: u.email, name: u.name } : null, configured });
  } catch {
    return Response.json({ user: null, configured });
  }
}
