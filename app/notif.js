'use client';
import { useEffect, useState } from 'react';
import { kunciPublik, simpanLangganan, ujiPush } from './push-actions';
const b64 = (s) => { const r = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const sama = (a, b) => !!a && a.byteLength === b.length && new Uint8Array(a).every((x, i) => x === b[i]);
async function daftar() {
  const reg = await navigator.serviceWorker.ready;
  const kunci = await kunciPublik();
  if (!kunci) throw new Error('Gagal mengambil kunci notifikasi dari server.');
  const k = b64(kunci);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sama(sub.options?.applicationServerKey, k)) { await sub.unsubscribe(); sub = null; }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: k });
  const err = await simpanLangganan(sub.toJSON());
  if (err) throw new Error('Gagal menyimpan perangkat: ' + err);
}
export default function Notif() {
  const [st, setSt] = useState('x'), [info, setInfo] = useState('');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
    const p = Notification.permission;
    if (p === 'denied') return setSt('blok');
    setSt('off');
    if (p === 'granted') daftar().then(() => setSt('on')).catch((e) => setInfo(String(e.message || e)));
  }, []);
  async function aktifkan() {
    try {
      const izin = await Notification.requestPermission();
      if (izin !== 'granted') { setSt(izin === 'denied' ? 'blok' : 'off'); return setInfo('Izin notifikasi tidak diberikan.'); }
      await daftar();
      setSt('on');
      setInfo('Aktif! Ketuk lagi untuk mengirim notifikasi tes.');
    } catch (e) { setInfo('Gagal: ' + (e.message || e)); }
  }
  async function tes() {
    setInfo('Mengirim…');
    try { await daftar(); setInfo(await ujiPush()); } catch (e) { setInfo('Gagal: ' + (e.message || e)); }
  }
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
