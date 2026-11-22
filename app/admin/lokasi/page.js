import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
async function cek() { const s = await getSession(); if (s?.role !== 'administrator') redirect('/dashboard'); }
async function tambah(fd) {
  'use server';
  await cek();
  const [lat, lng] = String(fd.get('koordinat') || '').split(',').map((x) => parseFloat(x.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) redirect('/admin/lokasi?e=1');
  await db.from('lokasi_absen').insert({ nama: String(fd.get('nama') || 'Lokasi').slice(0, 100), latitude: lat, longitude: lng, radius_meter: Math.max(10, parseInt(fd.get('radius')) || 100) });
  redirect('/admin/lokasi');
}
async function hapus(fd) { 'use server'; await cek(); await db.from('lokasi_absen').delete().eq('id', fd.get('id')); }
export default async function Halaman({ searchParams }) {
  await cek();
  const { data: list } = await db.from('lokasi_absen').select('*').order('id');
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      <h1>Lokasi Absensi</h1>
      <p className="muted">Pegawai hanya bisa absen di dalam radius titik-titik ini.</p>
      <div className="card">
        {(list || []).map((l) => (
          <form action={hapus} key={l.id} className="row">
            <input type="hidden" name="id" value={l.id} />
            <div><b>{l.nama}</b><br /><small className="muted">{Number(l.latitude).toFixed(6)}, {Number(l.longitude).toFixed(6)} · radius {l.radius_meter} m</small></div>
            <button className="ghost">Hapus</button>
          </form>
        ))}
        {!list?.length && <p className="muted">Belum ada titik lokasi.</p>}
      </div>
      <form action={tambah} className="card">
        <h3>Tambah titik</h3>
        {searchParams?.e && <div className="err">Format koordinat salah. Contoh: -7.3705, 108.5390</div>}
        <label>Nama tempat<input name="nama" required placeholder="Kantor Desa" /></label>
        <label>Koordinat (salin dari Google Maps)<input name="koordinat" required placeholder="-7.3705, 108.5390" /></label>
        <label>Radius (meter)<input name="radius" type="number" defaultValue="100" min="10" /></label>
        <button>Simpan</button>
      </form>
    </main>
  );
}
