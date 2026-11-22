import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);
export async function setSession(u) {
  const t = await new SignJWT({ id: u.id, nama: u.nama, role: u.role }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key());
  cookies().set('sid', t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}
export async function getSession() {
  const t = cookies().get('sid')?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}
export const clearSession = () => cookies().delete('sid');
