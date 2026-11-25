'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const MENU = {
  administrator: [['/dashboard', '🏠', 'Beranda'], ['/riwayat', '📊', 'Riwayat'], ['/persetujuan', '✅', 'Persetujuan'], ['/admin/pegawai', '👥', 'Pegawai'], ['/admin/jadwal', '🕐', 'Jadwal'], ['/admin/libur', '📅', 'Hari Libur'], ['/admin/qr', '🔳', 'QR Absensi'], ['/admin/lokasi', '🗺️', 'Lokasi'], ['/admin/pengaturan', '🎨', 'Pengaturan'], ['/admin/audit', '🧾', 'Audit Log']],
  pegawai: [['/dashboard', '🏠', 'Beranda'], ['/absen', '📍', 'Absen'], ['/pengajuan', '📝', 'Pengajuan'], ['/riwayat', '📊', 'Riwayat']],
  kepala_desa: [['/dashboard', '🏠', 'Beranda'], ['/riwayat', '📊', 'Riwayat'], ['/persetujuan', '✅', 'Persetujuan']],
};
const RUPA = { administrator: 'Administrator', pegawai: 'Pegawai', kepala_desa: 'Kepala Desa' };
export default function Shell({ user, nama, logo, keluar, children }) {
  const path = usePathname();
  const [buka, setBuka] = useState(false);
  useEffect(() => setBuka(false), [path]);
  if (!user || path.startsWith('/login')) return children;
  const mark = logo ? <img src={logo} alt="" className="logo" /> : <div className="logo mark">{nama[0]}</div>;
  const tutup = () => setBuka(false);
  return (
    <div className={'shell' + (buka ? ' buka' : '')}>
      <div className="scrim" onClick={tutup} />
      <aside className="side">
        <div className="brand">{mark}<b>{nama}</b><button className="tutup" onClick={tutup} aria-label="Tutup menu">✕</button></div>
        <nav className="nav">
          {MENU[user.role].map(([h, i, t]) => (
            <Link key={h} href={h} onClick={tutup} className={path === h || (h !== '/dashboard' && path.startsWith(h)) ? 'on' : ''}><i>{i}</i>{t}</Link>
          ))}
        </nav>
        <div className="me">
          <div className="av">{user.nama[0]}</div>
          <div><b>{user.nama}</b><small>{RUPA[user.role]}</small></div>
          <form action={keluar}><button className="ghost" title="Keluar">Keluar</button></form>
        </div>
      </aside>
      <div className="content">
        <header className="mtop">
          <button className="burger" onClick={() => setBuka(true)} aria-label="Buka menu">☰</button>{mark}<b>{nama}</b>
        </header>
        {children}
      </div>
    </div>
  );
}
