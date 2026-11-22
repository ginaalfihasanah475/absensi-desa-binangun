import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
const MODUL = ['auth', 'pegawai', 'jadwal', 'komplain', 'manual'];
export default async function Halaman({ searchParams }) {
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const modul = MODUL.includes(searchParams?.modul) ? searchParams.modul : '';
  let q = db.from('audit_trail').select('id,aksi,modul,keterangan,created_at,users(nama)').order('id', { ascending: false }).limit(100);
  if (modul) q = q.eq('modul', modul);
  const { data: rows } = await q;
  const wkt = (t) => new Date(t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
  return (
    <main className="wrap" style={{ display: 'grid', gap: 20 }}>
      <div><h1>Audit Log</h1><p className="muted">100 aktivitas terakhir di sistem.</p></div>
      <form className="card filter">
        <label>Modul<select name="modul" defaultValue={modul}><option value="">Semua</option>{MODUL.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        <button>Terapkan</button>
      </form>
      <div className="card scroll">
        <table className="tbl"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Keterangan</th></tr></thead>
          <tbody>{(rows || []).map((r) => <tr key={r.id}><td>{wkt(r.created_at)}</td><td>{r.users?.nama || '–'}</td><td><span className="chip st-menunggu">{r.aksi}</span></td><td>{r.modul}</td><td>{r.keterangan}</td></tr>)}</tbody></table>
        {!rows?.length && <p className="muted">Belum ada aktivitas.</p>}
      </div>
    </main>
  );
}
