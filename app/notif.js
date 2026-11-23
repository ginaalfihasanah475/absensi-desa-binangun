'use client';
import { useEffect, useState } from 'react';
import { kunciPublik, simpanLangganan, ujiPush } from './push-actions';
const b64 = (s) => { const r = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
export default function Notif() {
  const [st, setSt] = useState('x'), [info, setInfo] = useState('');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    const p = Notification.permission;
    setSt(p === 'granted' ? 'on' : p === 'denied' ? 'blok' : 'off');
    if (p === 'granted') navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => s && simpanLangganan(s.toJSON()));
  }, []);
  async function aktifkan() {
    try {
      const izin = await Notification.requestPermission();
      if (izin !== 'granted') { setSt(izin === 'denied' ? 'blok' : 'off'); return setInfo('Izin notifikasi tidak diberikan.'); }
      const reg = await navigator.serviceWorker.ready, kunci = await kunciPublik();
      if (!kunci) return setInfo('Gagal mengambil kunci notifikasi dari server.');
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(kunci) }));
      const ok = await simpanLangganan(sub.toJSON());
      setSt('on');
      setInfo(ok ? 'Aktif! Ketuk lagi untuk mengirim notifikasi tes.' : 'Perangkat gagal disimpan di database.');
    } catch (e) { setInfo('Gagal: ' + (e.message || e)); }
  }
  async function tes() { setInfo('Mengirim…'); setInfo(await ujiPush()); }
  if (st === 'x') return null;
  return (
    <>
      <button className="ghost notif" onClick={st === 'on' ? tes : aktifkan} disabled={st === 'blok'}>
        {st === 'on' ? '🔔 Kirim notifikasi tes' : st === 'blok' ? '🔕 Notifikasi diblokir' : '🔔 Aktifkan notifikasi'}
      </button>
      {info && <small className="notifinfo">{info}</small>}
    </>
  );
}
