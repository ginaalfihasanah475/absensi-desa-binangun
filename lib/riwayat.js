import { db } from './db';
export const BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;
export async function ambil(s, bulan, idPeg) {
  const [y, m] = bulan.split('-').map(Number);
  const akhir = `${bulan}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  let q = db.from('absensi').select('id,tanggal,jam_masuk,jam_pulang,status,pegawai(id,users(nama))')
    .gte('tanggal', `${bulan}-01`).lte('tanggal', akhir).is('deleted_at', null).order('tanggal', { ascending: false }).limit(1000);
  if (s.role === 'pegawai') {
    const { data: pg } = await db.from('pegawai').select('id').eq('id_users', s.id).maybeSingle();
    q = q.eq('id_pegawai', pg?.id ?? 0);
  } else if (idPeg) q = q.eq('id_pegawai', idPeg);
  return (await q).data || [];
}
