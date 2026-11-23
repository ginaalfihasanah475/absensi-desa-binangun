'use server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { vapid } from '@/lib/push';
export async function kunciPublik() { const s = await getSession(); return s ? (await vapid()).kunci_publik : null; }
export async function simpanLangganan(sub) {
  const s = await getSession();
  if (!s || !sub?.endpoint || !sub?.keys) return false;
  await db.from('push_subscriptions').upsert({ id_users: s.id, endpoint: String(sub.endpoint).slice(0, 500), public_key: sub.keys.p256dh, auth_token: sub.keys.auth, content_encoding: 'aes128gcm', updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
  return true;
}
