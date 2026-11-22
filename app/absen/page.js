import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Klien from './klien';
import Scanner from './scanner';
export const dynamic = 'force-dynamic';
export default async function Absen({ searchParams }) {
  const t = searchParams?.t || '';
  const s = await getSession();
  if (!s) redirect('/login?next=' + encodeURIComponent('/absen?t=' + t));
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      {t ? <Klien token={t} /> : <div className="card mid"><div className="pin">🔳</div><h2>Scan QR dulu</h2><p className="muted">Ketuk tombol di bawah lalu arahkan kamera ke QR absensi di kantor.</p><Scanner /></div>}
    </main>
  );
}
