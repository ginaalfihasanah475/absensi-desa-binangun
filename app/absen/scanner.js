'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function Scanner() {
  const r = useRouter(), [on, setOn] = useState(false), [err, setErr] = useState('');
  useEffect(() => {
    if (!on) return;
    let sc;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      sc = new Html5Qrcode('kamera');
      try {
        await sc.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (txt) => {
          try {
            const t = new URL(txt).searchParams.get('t');
            if (t) { sc.stop().catch(() => {}); r.replace('/absen?t=' + encodeURIComponent(t)); }
          } catch {}
        });
      } catch { setErr('Kamera tidak bisa dibuka. Izinkan akses kamera, atau scan pakai kamera bawaan HP.'); setOn(false); }
    })();
    return () => { if (sc?.isScanning) sc.stop().catch(() => {}); };
  }, [on]);
  return (
    <>
      {on && <div id="kamera" className="kamera" />}
      {err && <div className="err">{err}</div>}
      <button onClick={() => { setErr(''); setOn(!on); }}>{on ? 'Tutup kamera' : '📷 Buka kamera & scan QR'}</button>
    </>
  );
}
