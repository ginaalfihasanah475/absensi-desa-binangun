'use client';
import { useEffect, useState } from 'react';
export default function Pwa() {
  const [evt, setEvt] = useState(null), [ios, setIos] = useState(false), [tutup, setTutup] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const h = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    const mandiri = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !mandiri);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (tutup || (!evt && !ios)) return null;
  return (
    <div className="pasang">
      <span>{evt ? '📲 Pasang aplikasi di HP-mu' : '📲 Ketuk Bagikan, lalu “Tambahkan ke Layar Utama”'}</span>
      {evt && <button onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null); }}>Pasang</button>}
      <button className="ghost" onClick={() => setTutup(true)} aria-label="Tutup">✕</button>
    </div>
  );
}
