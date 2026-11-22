import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { waktu } from '@/lib/waktu';
import { ambil, BULAN } from '@/lib/riwayat';
export const dynamic = 'force-dynamic';
const NAMA = { hadir: 'Hadir', terlambat: 'Terlambat', tidak_hadir: 'Tidak hadir' };
export default async function Halaman({ searchParams }) {
  const s = await getSession();
  if (!s) redirect('/login');
  const semua = s.role !== 'pegawai';
  const bulan = BULAN.test(searchParams?.bulan || '') ? searchParams.bulan : waktu().tanggal.slice(0, 7);
  const idPeg = semua ? String(searchParams?.pegawai || '').replace(/\D/g, '') : '';
  const rows = await ambil(s, bulan, idPeg);
  const { data: daftar } = semua ? await db.from('pegawai').select('id,users(nama)').is('deleted_at', null).order('id') : {};
  const hit = (k) => rows.filter((r) => r.status === k).length;
  const per = {};
  rows.forEach((r) => { const d = r.tanggal.slice(8); (per[d] ||= { hadir: 0, terlambat: 0, tidak_hadir: 0 })[r.status]++; });
  const hari = Object.keys(per).sort();
  const tot = (d) => per[d].hadir + per[d].terlambat + per[d].tidak_hadir;
  const maks = Math.max(1, ...hari.map(tot));
  return (
    <main className="wrap" style={{ display: 'grid', gap: 20 }}>
      <div><h1>Riwayat & Laporan</h1><p className="muted">{semua ? 'Rekap kehadiran seluruh pegawai.' : 'Rekap kehadiranmu.'}</p></div>
      <form className="card filter">
        <label>Bulan<input type="month" name="bulan" defaultValue={bulan} /></label>
        {semua && <label>Pegawai<select name="pegawai" defaultValue={idPeg}><option value="">Semua pegawai</option>{(daftar || []).map((p) => <option key={p.id} value={p.id}>{p.users?.nama}</option>)}</select></label>}
        <button>Terapkan</button>
        {semua && <a className="btn" href={`/riwayat/export?bulan=${bulan}&pegawai=${idPeg}`}>⬇️ Unduh CSV</a>}
      </form>
      <div className="grid">{['hadir', 'terlambat', 'tidak_hadir'].map((k) => <div className="stat" key={k}><span>{NAMA[k]}</span><strong>{hit(k)}</strong></div>)}</div>
      <div className="card">
        <h3>Kehadiran per hari</h3>
        {hari.length ? <>
          <div className="bars">{hari.map((d) => (
            <div className="bar" key={d} title={`Tgl ${d}: ${per[d].hadir} hadir, ${per[d].terlambat} terlambat, ${per[d].tidak_hadir} tidak hadir`}>
              <div className="stack" style={{ height: `${(tot(d) / maks) * 84}%` }}>
                {['tidak_hadir', 'terlambat', 'hadir'].map((k) => per[d][k] > 0 && <div key={k} className={'s-' + k} style={{ flex: per[d][k] }} />)}
              </div><span>{d}</span>
            </div>))}
          </div>
          <div className="leg"><span><i className="s-hadir" />Hadir</span><span><i className="s-terlambat" />Terlambat</span><span><i className="s-tidak_hadir" />Tidak hadir</span></div>
        </> : <p className="muted">Belum ada data di bulan ini.</p>}
      </div>
      <div className="card scroll">
        <table className="tbl"><thead><tr><th>Tanggal</th>{semua && <th>Nama</th>}<th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.tanggal}</td>{semua && <td>{r.pegawai?.users?.nama}</td>}<td>{r.jam_masuk?.slice(0, 5) || '–'}</td><td>{r.jam_pulang?.slice(0, 5) || '–'}</td><td><span className={'chip st-' + r.status}>{NAMA[r.status]}</span></td></tr>))}
          </tbody></table>
        {!rows.length && <p className="muted">Tidak ada catatan.</p>}
      </div>
    </main>
  );
}
