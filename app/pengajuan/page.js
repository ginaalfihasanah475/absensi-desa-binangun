import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { waktu } from '@/lib/waktu';
import { unggah } from '@/lib/simpan';
export const dynamic = 'force-dynamic';
const P = '/pengajuan';
const JENIS = { sakit: 'Sakit', izin: 'Izin', dinas_luar: 'Dinas luar' };
const STATUS = { menunggu: 'Menunggu', diterima: 'Diterima', disetujui: 'Disetujui', ditolak: 'Ditolak' };
const galat = (m) => redirect(P + '?e=' + encodeURIComponent(m));
const jam = (v) => (/^\d{2}:\d{2}$/.test(v) ? v : null);
async function saya() {
  const s = await getSession();
  if (s?.role !== 'pegawai') redirect('/dashboard');
  const { data: pg } = await db.from('pegawai').select('id').eq('id_users', s.id).is('deleted_at', null).maybeSingle();
  if (!pg) redirect('/dashboard');
  return pg.id;
}
async function koreksi(fd) {
  'use server';
  const id = await saya();
  const ket = String(fd.get('keterangan') || '').trim().slice(0, 500);
  const masuk = jam(String(fd.get('masuk') || '')), pulang = jam(String(fd.get('pulang') || ''));
  const { data: a } = await db.from('absensi').select('id,jam_masuk,jam_pulang').eq('id', fd.get('absensi')).eq('id_pegawai', id).is('deleted_at', null).maybeSingle();
  if (!a || !ket || (!masuk && !pulang)) galat('Pilih absensi, isi alasan, dan minimal satu jam usulan.');
  const { data: dup } = await db.from('komplain').select('id').eq('id_absensi', a.id).eq('status', 'menunggu').maybeSingle();
  if (dup) galat('Absensi ini sudah punya pengajuan yang menunggu.');
  const u = await unggah(fd.get('bukti'), 'koreksi');
  if (u.error) galat(u.error);
  await db.from('komplain').insert({ bukti: u.path, id_absensi: a.id, keterangan: ket, jam_masuk_usulan: masuk, jam_pulang_usulan: pulang, jam_masuk_lama: a.jam_masuk, jam_pulang_lama: a.jam_pulang, tgl_pengajuan: waktu().tanggal });
  redirect(P + '?ok=1');
}
async function manual(fd) {
  'use server';
  const id = await saya();
  const tgl = String(fd.get('tanggal') || ''), jenis = String(fd.get('jenis') || ''), alasan = String(fd.get('alasan') || '').trim().slice(0, 500);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl) || tgl > waktu().tanggal || !JENIS[jenis] || !alasan) galat('Isi tanggal (tidak boleh di masa depan), jenis, dan alasan.');
  const { data: dup } = await db.from('absensi_manual').select('id').eq('id_pegawai', id).eq('tanggal', tgl).is('deleted_at', null).in('status', ['menunggu', 'disetujui']).maybeSingle();
  if (dup) galat('Sudah ada pengajuan manual di tanggal itu.');
  const u = await unggah(fd.get('bukti'), 'manual');
  if (u.error) galat(u.error);
  await db.from('absensi_manual').insert({ bukti: u.path, id_pegawai: id, tanggal: tgl, jenis, alasan, lokasi: String(fd.get('lokasi') || '').trim().slice(0, 255) || null });
  redirect(P + '?ok=1');
}
export default async function Halaman({ searchParams }) {
  const id = await saya();
  const dari = new Date(Date.now() - 30 * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const [{ data: abs }, { data: kom }, { data: man }] = await Promise.all([
    db.from('absensi').select('id,tanggal,jam_masuk,jam_pulang,status').eq('id_pegawai', id).gte('tanggal', dari).is('deleted_at', null).order('tanggal', { ascending: false }),
    db.from('komplain').select('id,keterangan,status,tgl_pengajuan').in('id_absensi', (await db.from('absensi').select('id').eq('id_pegawai', id)).data?.map((x) => x.id) || [0]).order('id', { ascending: false }).limit(15),
    db.from('absensi_manual').select('*').eq('id_pegawai', id).is('deleted_at', null).order('id', { ascending: false }).limit(15),
  ]);
  return (
    <main className="wrap" style={{ display: 'grid', gap: 20 }}>
      <div><h1>Pengajuan</h1><p className="muted">Koreksi jam absen atau ajukan absensi manual (sakit, izin, dinas luar).</p></div>
      {searchParams?.ok && <div className="ok">Pengajuan terkirim ✅</div>}
      {searchParams?.e && <div className="err">{searchParams.e}</div>}
      <div className="dua">
        <form action={koreksi} className="card">
          <h3>Koreksi jam absen</h3>
          <label>Absensi (30 hari terakhir)<select name="absensi" required>{(abs || []).map((a) => <option key={a.id} value={a.id}>{a.tanggal} · {a.jam_masuk?.slice(0, 5) || '--'} – {a.jam_pulang?.slice(0, 5) || '--'} · {a.status}</option>)}</select></label>
          <div className="duo"><label>Jam masuk yang benar<input type="time" name="masuk" /></label><label>Jam pulang yang benar<input type="time" name="pulang" /></label></div>
          <label>Alasan<input name="keterangan" required maxLength={500} placeholder="Contoh: sinyal GPS bermasalah" /></label>
          <label>Bukti (opsional, foto/PDF maks 2 MB)<input type="file" name="bukti" accept="image/*,application/pdf" /></label>
          <button>Kirim koreksi</button>
        </form>
        <form action={manual} className="card">
          <h3>Absensi manual</h3>
          <div className="duo"><label>Tanggal<input type="date" name="tanggal" required /></label><label>Jenis<select name="jenis">{Object.entries(JENIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label></div>
          <label>Alasan<input name="alasan" required maxLength={500} /></label>
          <label>Lokasi (opsional)<input name="lokasi" maxLength={255} placeholder="Contoh: Kantor Kecamatan" /></label>
          <label>Bukti (opsional, foto/PDF maks 2 MB)<input type="file" name="bukti" accept="image/*,application/pdf" /></label>
          <button>Kirim pengajuan</button>
        </form>
      </div>
      <div className="card">
        <h3>Riwayat pengajuan</h3>
        {[...(kom || []).map((k) => ({ k: 'k' + k.id, t: 'Koreksi · ' + k.tgl_pengajuan, d: k.keterangan, s: k.status })), ...(man || []).map((m) => ({ k: 'm' + m.id, t: `${JENIS[m.jenis]} · ${m.tanggal}`, d: m.alasan, s: m.status }))].map((r) => (
          <div className="row" key={r.k}><div><b>{r.t}</b><br /><small className="muted">{r.d}</small></div><span className={'chip st-' + r.s}>{STATUS[r.s]}</span></div>
        ))}
        {!kom?.length && !man?.length && <p className="muted">Belum ada pengajuan.</p>}
      </div>
    </main>
  );
}
