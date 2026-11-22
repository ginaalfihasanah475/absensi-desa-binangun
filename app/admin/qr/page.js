import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
async function buatBaru() {
  'use server';
  const s = await getSession();
  if (s?.role !== 'administrator') return;
  await db.from('qr_code').update({ status: 'nonaktif' }).eq('status', 'aktif');
  await db.from('qr_code').insert({ nama: 'QR Absensi Utama', token: crypto.randomUUID().replaceAll('-', ''), expired_at: null, status: 'aktif' });
}
export default async function Halaman() {
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const { data: qr } = await db.from('qr_code').select('*').eq('status', 'aktif').order('id', { ascending: false }).limit(1).maybeSingle();
  const url = qr ? `https://${headers().get('host')}/absen?t=${qr.token}` : null;
  const img = url ? await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: '#111827', light: '#ffffff' } }) : null;
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      <h1>QR Absensi</h1>
      <p className="muted">Satu QR permanen. Cetak dan tempel di kantor desa.</p>
      <div className="card mid">
        {img ? <><img src={img} alt="QR absensi" className="qr" /><a href={img} download="qr-absensi.png" className="btn">⬇️ Unduh QR (PNG)</a></> : <p>Belum ada QR aktif.</p>}
        <form action={buatBaru}><button className="ghost">{qr ? 'Buat ulang QR (yang lama mati)' : 'Buat QR'}</button></form>
      </div>
    </main>
  );
}
