import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { catat } from '@/lib/log';
export const dynamic = 'force-dynamic';
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const aktif = () => db.from('jadwal_kerja').select('*').eq('status', 'aktif').is('deleted_at', null).limit(1).maybeSingle();
async function simpan(fd) {
  'use server';
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const hari = HARI.filter((h) => fd.get('h_' + h));
  const re = /^\d{2}:\d{2}$/, m = String(fd.get('masuk')), p = String(fd.get('pulang'));
  if (!hari.length || !re.test(m) || !re.test(p) || m >= p) redirect('/admin/jadwal?e=' + encodeURIComponent('Pilih minimal satu hari, dan jam pulang harus setelah jam masuk.'));
  const row = { jam_masuk: m, jam_pulang: p, toleransi: Math.min(120, Math.max(0, parseInt(fd.get('toleransi')) || 0)), hari: hari.join(','), status: 'aktif', updated_at: new Date().toISOString() };
  const { data: j } = await aktif();
  if (j) await db.from('jadwal_kerja').update(row).eq('id', j.id); else await db.from('jadwal_kerja').insert(row);
  await catat(s.id, 'ubah', 'jadwal', `Jadwal ${hari.join(',')} ${m}-${p}, toleransi ${row.toleransi} menit`);
  redirect('/admin/jadwal?ok=1');
}
export default async function Halaman({ searchParams }) {
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const { data: j } = await aktif();
  const on = (j?.hari || 'Senin,Selasa,Rabu,Kamis,Jumat').split(',');
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      <h1>Jadwal Kerja</h1>
      <p className="muted">Menentukan hari kerja, jam masuk/pulang, dan batas keterlambatan.</p>
      <form action={simpan} className="card">
        {searchParams?.ok && <div className="ok">Jadwal disimpan ✅</div>}
        {searchParams?.e && <div className="err">{searchParams.e}</div>}
        <label>Hari kerja<div className="hari">{HARI.map((h) => <label className="cek" key={h}><input type="checkbox" name={'h_' + h} defaultChecked={on.includes(h)} />{h}</label>)}</div></label>
        <div className="duo">
          <label>Jam masuk<input type="time" name="masuk" defaultValue={j?.jam_masuk?.slice(0, 5) || '08:00'} required /></label>
          <label>Jam pulang<input type="time" name="pulang" defaultValue={j?.jam_pulang?.slice(0, 5) || '16:00'} required /></label>
        </div>
        <label>Toleransi terlambat (menit)<input type="number" name="toleransi" min="0" max="120" defaultValue={j?.toleransi ?? 15} /></label>
        <button>Simpan jadwal</button>
      </form>
    </main>
  );
}
