import 'server-only';
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = 'sh_session';
const DAYS = 30;

export type User = { _id: string; email: string; name: string; hash: string; salt: string; createdAt: Date };

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return { salt: salt.toString('hex'), hash: (await scrypt(pw, salt, 64)).toString('hex') };
}
export async function checkPassword(pw: string, salt: string, hash: string) {
  const a = await scrypt(pw, Buffer.from(salt, 'hex'), 64);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

const secret = () => process.env.SESSION_SECRET || '';
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const mac = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url');

export const authConfigured = () => secret().length >= 16 && !!process.env.MONGODB_URI;

export function signSession(uid: string) {
  const body = b64(JSON.stringify({ uid, exp: Date.now() + DAYS * 864e5 }));
  return `${body}.${mac(body)}`;
}
function readToken(tok?: string): string | null {
  if (!tok || !secret()) return null;
  const [body, sig] = tok.split('.');
  if (!body || !sig) return null;
  const good = mac(body);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() && typeof p.uid === 'string' ? p.uid : null;
  } catch {
    return null;
  }
}

export async function sessionUid(): Promise<string | null> {
  return readToken((await cookies()).get(COOKIE)?.value);
}
export async function setSession(uid: string) {
  (await cookies()).set(COOKIE, signSession(uid), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 });
}
export async function clearSession() {
  (await cookies()).set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
