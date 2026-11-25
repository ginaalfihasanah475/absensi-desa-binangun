import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { catat } from '@/lib/log';
import { urlBukti } from '@/lib/simpan';
export const dynamic = 'force-dynamic';
const P = '/persetujuan';
const JENIS = { sakit: 'Sakit', izin: 'Izin', dinas_luar: 'Dinas luar' };
const mnt = (s) => { const [h, m] = s.split(':'); return +h * 60 + +m; };
const t5 = (v) => v?.slice(0, 5) || '--:--';
async function cek() { const s = await getSession(); if (!s || s.role === 'pegawai') redirect('/dashboard'); return s; }
const jadwalAktif = () => db.from('jadwal_kerja').select('*').eq('status', 'aktif').is('deleted_at', null).limit(1).maybeSingle();
async function putusKoreksi(fd) {
  'use server';
  const s = await cek(), terima = fd.get('aksi') === 'terima', now = new Date().toISOString();
  const { data: k } = await db.from('komplain').select('*,absensi(jam_masuk,jam_pulang,status)').eq('id', fd.get('id')).eq('status', 'menunggu').maybeSingle();
  if (!k) redirect(P);
  if (terima) {
    const { data: j } = await jadwalAktif();
    const masuk = k.jam_masuk_usulan || k.absensi.jam_masuk, pulang = k.jam_pulang_usulan || k.absensi.jam_pulang;
    const status = masuk && j ? (mnt(masuk) > mnt(j.jam_masuk) + j.toleransi ? 'terlambat' : 'hadir') : k.absensi.status;
    await db.from('absensi').update({ jam_masuk: masuk, jam_pulang: pulang, status, dikoreksi: true, updated_at: now }).eq('id', k.id_absensi);
  }
  await db.from('komplain').update({ status: terima ? 'diterima' : 'ditolak', updated_at: now }).eq('id', k.id);
  await catat(s.id, terima ? 'setuju' : 'tolak', 'komplain', `Koreksi jam id ${k.id} ${terima ? 'diterima' : 'ditolak'}`);
  redirect(P);
}
async function putusManual(fd) {
  'use server';
  const s = await cek(), setuju = fd.get('aksi') === 'setuju', now = new Date().toISOString();
  const { data: m } = await db.from('absensi_manual').select('*').eq('id', fd.get('id')).eq('status', 'menunggu').maybeSingle();
  if (!m) redirect(P);
  if (setuju && m.jenis === 'dinas_luar') {
    const [{ data: j }, { data: qr }, { data: ada }] = await Promise.all([
      jadwalAktif(),
      db.from('qr_code').select('id').order('id', { ascending: false }).limit(1).maybeSingle(),
      db.from('absensi').select('id').eq('id_pegawai', m.id_pegawai).eq('tanggal', m.tanggal).is('deleted_at', null).maybeSingle(),
    ]);
    if (j && qr && !ada) await db.from('absensi').insert({ id_pegawai: m.id_pegawai, id_jadwal: j.id, id_qr: qr.id, tanggal: m.tanggal, jam_masuk: j.jam_masuk, jam_pulang: j.jam_pulang, status: 'hadir', dikoreksi: true });
  }
  await db.from('absensi_manual').update({ status: setuju ? 'disetujui' : 'ditolak', updated_at: now }).eq('id', m.id);
  await catat(s.id, setuju ? 'setuju' : 'tolak', 'manual', `Absensi manual id ${m.id} ${setuju ? 'disetujui' : 'ditolak'}`);
  redirect(P);
}
const Tombol = ({ a, b, ta, tb }) => <div className="acts"><button name="aksi" value={a}>{ta}</button><button name="aksi" value={b} className="ghost">{tb}</button></div>;
export default async function Halaman() {
  await cek();
  const [{ data: kom }, { data: man }] = await Promise.all([
    db.from('komplain').select('id,bukti,keterangan,jam_masuk_lama,jam_pulang_lama,jam_masuk_usulan,jam_pulang_usulan,absensi(tanggal,pegawai(users(nama)))').eq('status', 'menunggu').order('id'),
    db.from('absensi_manual').select('*,pegawai(users(nama))').eq('status', 'menunggu').is('deleted_at', null).order('id'),
  ]);
  await Promise.all([...(kom || []), ...(man || [])].map(async (x) => { x.url = await urlBukti(x.bukti); }));
  return (
    <main className="wrap" style={{ display: 'grid', gap: 20 }}>
      <div><h1>Persetujuan</h1><p className="muted">Periksa pengajuan koreksi jam dan absensi manual dari pegawai.</p></div>
      <div className="dua">
        <div className="card"><h3>Koreksi jam ({kom?.length || 0})</h3>
          {(kom || []).map((k) => (
            <form action={putusKoreksi} className="row" key={k.id}><input type="hidden" name="id" value={k.id} />
              <div><b>{k.absensi?.pegawai?.users?.nama}</b> · {k.absensi?.tanggal}<br />
                <small className="muted">Masuk {t5(k.jam_masuk_lama)} → {t5(k.jam_masuk_usulan || k.jam_masuk_lama)} · Pulang {t5(k.jam_pulang_lama)} → {t5(k.jam_pulang_usulan || k.jam_pulang_lama)}<br />“{k.keterangan}”{k.url && <><br /><a href={k.url} target="_blank" rel="noreferrer">📎 Lihat bukti</a></>}</small></div>
              <Tombol a="terima" b="tolak" ta="Terima" tb="Tolak" /></form>
          ))}
          {!kom?.length && <p className="muted">Tidak ada yang menunggu. 🎉</p>}
        </div>
        <div className="card"><h3>Absensi manual ({man?.length || 0})</h3>
          {(man || []).map((m) => (
            <form action={putusManual} className="row" key={m.id}><input type="hidden" name="id" value={m.id} />
              <div><b>{m.pegawai?.users?.nama}</b> · {m.tanggal}<br />
                <small className="muted">{JENIS[m.jenis]}{m.lokasi ? ` di ${m.lokasi}` : ''}<br />“{m.alasan}”{m.url && <><br /><a href={m.url} target="_blank" rel="noreferrer">📎 Lihat bukti</a></>}</small></div>
              <Tombol a="setuju" b="tolak" ta="Setujui" tb="Tolak" /></form>
          ))}
          {!man?.length && <p className="muted">Tidak ada yang menunggu. 🎉</p>}
        </div>
      </div>
    </main>
  );
}
