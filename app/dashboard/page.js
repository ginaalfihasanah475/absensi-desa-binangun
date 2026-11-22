import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, getPengaturan, logoUrl } from '@/lib/db';
import { getSession, clearSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
async function keluar() { 'use server'; clearSession(); redirect('/login'); }
const RUPA = { administrator: ['Administrator', '🛠️'], pegawai: ['Pegawai', '🧑‍💼'], kepala_desa: ['Kepala Desa', '🏛️'] };
const H = { count: 'exact', head: true };
const n = async (q) => (await q).count ?? 0;
export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect('/login');
  const p = await getPengaturan(); const logo = logoUrl(p);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  let kartu;
  if (s.role === 'pegawai') {
    const { data: pg } = await db.from('pegawai').select('id').eq('id_users', s.id).maybeSingle();
    const { data: a } = pg ? await db.from('absensi').select('*').eq('id_pegawai', pg.id).eq('tanggal', today).maybeSingle() : {};
    kartu = [['Status hari ini', a ? a.status.replace('_', ' ') : 'belum absen'], ['Jam masuk', a?.jam_masuk?.slice(0, 5) || '--:--'], ['Jam pulang', a?.jam_pulang?.slice(0, 5) || '--:--']];
  } else {
    kartu = [
      ['Total pegawai', await n(db.from('pegawai').select('*', H).is('deleted_at', null))],
      ['Hadir hari ini', await n(db.from('absensi').select('*', H).eq('tanggal', today).in('status', ['hadir', 'terlambat']))],
      ['Pengajuan menunggu', (await n(db.from('komplain').select('*', H).eq('status', 'menunggu'))) + (await n(db.from('absensi_manual').select('*', H).eq('status', 'menunggu').is('deleted_at', null)))],
    ];
  }
  const menu = s.role === 'pegawai' ? [['/absen', '📍 Absen']] : s.role === 'administrator' ? [['/admin/pegawai', '👥 Pegawai'], ['/admin/jadwal', '🕐 Jadwal Kerja'], ['/admin/qr', '🔳 QR Absensi'], ['/admin/lokasi', '🗺️ Lokasi Absen'], ['/admin/pengaturan', '🎨 Pengaturan']] : [];
  const [peran, ikon] = RUPA[s.role];
  return (
    <>
      <main className="wrap">
        <div className="hello"><h1>Halo, {s.nama}! 👋</h1><p>Ringkasan hari ini · {today}</p></div>
        <div className="grid">{kartu.map(([k, v]) => <div className="stat" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
      </main>
    </>
  );
}
