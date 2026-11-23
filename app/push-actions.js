'use server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { vapid, keUser } from '@/lib/push';
export async function kunciPublik() { const s = await getSession(); return s ? (await vapid()).kunci_publik : null; }
export async function simpanLangganan(sub) {
  const s = await getSession();
  if (!s || !sub?.endpoint || !sub?.keys) return false;
  const { error } = await db.from('push_subscriptions').upsert({ id_users: s.id, endpoint: String(sub.endpoint).slice(0, 500), public_key: sub.keys.p256dh, auth_token: sub.keys.auth, content_encoding: 'aes128gcm', updated_at: new Date().toISOString() }, { onConflict: 'endpoint' });
  return !error;
}
export async function ujiPush() {
  const s = await getSession();
  if (!s) return 'Belum login.';
  const { data: subs } = await db.from('push_subscriptions').select('id').eq('id_users', s.id);
  if (!subs?.length) return 'Belum ada perangkat terdaftar untuk akunmu. Ketuk “Aktifkan notifikasi” dulu.';
  const r = await keUser([s.id], { title: 'Tes notifikasi 🔔', body: 'Kalau kamu melihat ini, notifikasi berfungsi!', url: '/dashboard' });
  return r.terkirim ? `Terkirim ke ${r.terkirim} perangkat. Cek notifikasi di perangkatmu.` : `Gagal mengirim${r.pesan ? ': ' + r.pesan : '.'}`;
}
