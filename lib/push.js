import webpush from 'web-push';
import { db } from './db';
export async function vapid() {
  const ambil = async () => (await db.from('vapid').select('*').eq('id', 1).maybeSingle()).data;
  const ada = await ambil();
  if (ada) return ada;
  const k = webpush.generateVAPIDKeys();
  const { error } = await db.from('vapid').insert({ id: 1, kunci_publik: k.publicKey, kunci_privat: k.privateKey });
  return error ? await ambil() : { kunci_publik: k.publicKey, kunci_privat: k.privateKey };
}
export async function keUser(ids, payload) {
  try {
    const v = await vapid();
    webpush.setVapidDetails('mailto:admin@example.com', v.kunci_publik, v.kunci_privat);
    const { data: subs } = await db.from('push_subscriptions').select('*').in('id_users', ids);
    await Promise.all((subs || []).map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.public_key, auth: s.auth_token } }, JSON.stringify(payload)); }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await db.from('push_subscriptions').delete().eq('id', s.id); }
    }));
  } catch {}
}
export async function kePeran(peran, payload) {
  const { data } = await db.from('users').select('id').in('role', peran).is('deleted_at', null);
  return keUser((data || []).map((x) => x.id), payload);
}
