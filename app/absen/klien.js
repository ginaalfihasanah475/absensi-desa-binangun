'use client';
import { useState } from 'react';
import { absen } from './actions';
export default function Klien({ token }) {
  const [st, setSt] = useState(null), [busy, setBusy] = useState(false);
  function mulai() {
    setBusy(true); setSt(null);
    if (!navigator.geolocation) { setBusy(false); return setSt({ ok: false, pesan: 'Browser tidak mendukung GPS.' }); }
    navigator.geolocation.getCurrentPosition(
      async (p) => { setSt(await absen(token, p.coords.latitude, p.coords.longitude)); setBusy(false); },
      () => { setSt({ ok: false, pesan: 'Izin lokasi ditolak. Aktifkan GPS dan izinkan lokasi untuk situs ini.' }); setBusy(false); },
      { enableHighAccuracy: true, timeout: 15000 });
  }
  return (
    <div className="card mid">
      <div className={`pin ${busy ? 'on' : ''}`}>📍</div>
      <h2>Absen Sekarang</h2>
      <p className="muted">Pastikan GPS aktif dan kamu berada di area kantor.</p>
      <button onClick={mulai} disabled={busy}>{busy ? 'Memeriksa lokasi…' : 'Absen masuk / pulang'}</button>
      {st && <div className={st.ok ? 'ok' : 'err'}>{st.pesan}</div>}
    </div>
  );
}
