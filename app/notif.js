'use client';
import { useEffect, useState } from 'react';
import { kunciPublik, simpanLangganan } from './push-actions';
const b64 = (s) => { const r = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
export default function Notif() {
  const [st, setSt] = useState('x');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    const p = Notification.permission;
    setSt(p === 'granted' ? 'on' : p === 'denied' ? 'blok' : 'off');
    if (p === 'granted') navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => s && simpanLangganan(s.toJSON()));
  }, []);
  async function aktifkan() {
    const izin = await Notification.requestPermission();
    if (izin !== 'granted') return setSt(izin === 'denied' ? 'blok' : 'off');
    const reg = await navigator.serviceWorker.ready, kunci = await kunciPublik();
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(kunci) }));
    await simpanLangganan(sub.toJSON());
    setSt('on');
  }
  if (st === 'x') return null;
  return <button className="ghost notif" onClick={aktifkan} disabled={st !== 'off'}>{st === 'on' ? '🔔 Notifikasi aktif' : st === 'blok' ? '🔕 Notifikasi diblokir' : '🔔 Aktifkan notifikasi'}</button>;
}
