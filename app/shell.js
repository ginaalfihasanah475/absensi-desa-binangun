'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const MENU = {
  administrator: [['/dashboard', '🏠', 'Beranda'], ['/admin/pegawai', '👥', 'Pegawai'], ['/admin/jadwal', '🕐', 'Jadwal'], ['/admin/qr', '🔳', 'QR Absensi'], ['/admin/lokasi', '🗺️', 'Lokasi'], ['/admin/pengaturan', '🎨', 'Pengaturan']],
  pegawai: [['/dashboard', '🏠', 'Beranda'], ['/absen', '📍', 'Absen']],
  kepala_desa: [['/dashboard', '🏠', 'Beranda']],
};
const RUPA = { administrator: 'Administrator', pegawai: 'Pegawai', kepala_desa: 'Kepala Desa' };
export default function Shell({ user, nama, logo, keluar, children }) {
  const path = usePathname();
  if (!user || path.startsWith('/login')) return children;
  const mark = logo ? <img src={logo} alt="" className="logo" /> : <div className="logo mark">{nama[0]}</div>;
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">{mark}<b>{nama}</b></div>
        <nav className="nav">
          {MENU[user.role].map(([h, i, t]) => (
            <Link key={h} href={h} className={path === h || (h !== '/dashboard' && path.startsWith(h)) ? 'on' : ''}><i>{i}</i>{t}</Link>
          ))}
        </nav>
        <div className="me">
          <div className="av">{user.nama[0]}</div>
          <div><b>{user.nama}</b><small>{RUPA[user.role]}</small></div>
          <form action={keluar}><button className="ghost" title="Keluar">⎋</button></form>
        </div>
      </aside>
      <div className="content">
        <header className="mtop">{mark}<b>{nama}</b></header>
        {children}
      </div>
    </div>
  );
}
