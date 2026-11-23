import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { catat } from '@/lib/log';
import { waktu } from '@/lib/waktu';
export const dynamic = 'force-dynamic';
const P = '/admin/libur';
async function cek() { const s = await getSession(); if (s?.role !== 'administrator') redirect('/dashboard'); return s; }
async function tambah(fd) {
  'use server';
  const s = await cek(), tgl = String(fd.get('tanggal') || ''), ket = String(fd.get('keterangan') || '').trim().slice(0, 150);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl) || !ket) redirect(P + '?e=1');
  const { error } = await db.from('hari_libur').insert({ tanggal: tgl, keterangan: ket });
  if (error) redirect(P + '?e=2');
  await catat(s.id, 'tambah', 'jadwal', `Hari libur ${tgl}: ${ket}`);
  redirect(P);
}
async function hapus(fd) { 'use server'; await cek(); await db.from('hari_libur').delete().eq('id', fd.get('id')); redirect(P); }
const PESAN = { 1: 'Isi tanggal dan keterangan.', 2: 'Tanggal itu sudah terdaftar, atau tabel hari_libur belum dibuat (jalankan file SQL 03).' };
export default async function Halaman({ searchParams }) {
  await cek();
  const dari = new Date(Date.now() - 30 * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const { data: list } = await db.from('hari_libur').select('*').gte('tanggal', dari).order('tanggal');
  const today = waktu().tanggal;
  const f = (t) => new Date(t + 'T00:00:00+07:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  return (
    <main className="wrap narrow">
      <h1>Hari Libur</h1>
      <p className="muted">Pada tanggal yang tercatat di sini, pegawai tidak bisa absen.</p>
      <div className="card">
        {(list || []).map((l) => (
          <form action={hapus} className="row" key={l.id}><input type="hidden" name="id" value={l.id} />
            <div><b>{l.keterangan}</b><br /><small className="muted">{f(l.tanggal)}{l.tanggal < today ? ' · sudah lewat' : ''}</small></div>
            <button className="ghost">Hapus</button></form>
        ))}
        {!list?.length && <p className="muted">Belum ada hari libur.</p>}
      </div>
      <form action={tambah} className="card">
        <h3>Tambah hari libur</h3>
        {searchParams?.e && <div className="err">{PESAN[searchParams.e]}</div>}
        <label>Tanggal<input type="date" name="tanggal" required /></label>
        <label>Keterangan<input name="keterangan" required maxLength={150} placeholder="Contoh: Hari Kemerdekaan RI" /></label>
        <button>Simpan</button>
      </form>
    </main>
  );
}
