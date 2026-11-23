'use server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { jarak } from '@/lib/geo';
import { waktu } from '@/lib/waktu';
const mnt = (s) => { const [h, m] = s.split(':'); return +h * 60 + +m; };
const gagal = (pesan) => ({ ok: false, pesan });
export async function absen(token, lat, lng) {
  const s = await getSession();
  if (!s || s.role !== 'pegawai') return gagal('Hanya akun pegawai yang bisa absen.');
  lat = Number(lat); lng = Number(lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return gagal('Lokasi tidak terbaca. Coba lagi.');
  const { data: qr } = await db.from('qr_code').select('id').eq('token', String(token || '')).eq('status', 'aktif').maybeSingle();
  if (!qr) return gagal('QR tidak valid atau sudah dinonaktifkan. Scan QR terbaru di kantor.');
  const { data: pg } = await db.from('pegawai').select('id').eq('id_users', s.id).is('deleted_at', null).maybeSingle();
  if (!pg) return gagal('Data pegawai untuk akunmu belum dibuat oleh admin.');
  const { data: lokasi } = await db.from('lokasi_absen').select('*').eq('aktif', true);
  if (!lokasi?.length) return gagal('Admin belum menentukan titik lokasi absensi.');
  const t = lokasi.map((l) => ({ l, m: jarak(lat, lng, Number(l.latitude), Number(l.longitude)) })).sort((a, b) => a.m - b.m)[0];
  if (t.m > t.l.radius_meter) return gagal(`Kamu berjarak ${Math.round(t.m)} m dari ${t.l.nama}. Batas absen ${t.l.radius_meter} m.`);
  const { data: j } = await db.from('jadwal_kerja').select('*').eq('status', 'aktif').is('deleted_at', null).limit(1).maybeSingle();
  if (!j) return gagal('Jadwal kerja aktif belum ada.');
  const w = waktu();
  if (!j.hari.split(',').includes(w.hari)) return gagal(`Hari ${w.hari} bukan hari kerja.`);
  const { data: libur } = await db.from('hari_libur').select('keterangan').eq('tanggal', w.tanggal).maybeSingle();
  if (libur) return gagal(`Hari ini libur: ${libur.keterangan}.`);
  const { data: a } = await db.from('absensi').select('*').eq('id_pegawai', pg.id).eq('tanggal', w.tanggal).is('deleted_at', null).maybeSingle();
  if (!a) {
    const status = mnt(w.jam) > mnt(j.jam_masuk) + j.toleransi ? 'terlambat' : 'hadir';
    const { error } = await db.from('absensi').insert({ id_pegawai: pg.id, id_jadwal: j.id, id_qr: qr.id, tanggal: w.tanggal, jam_masuk: w.jam, status, latitude_masuk: lat, longitude_masuk: lng });
    if (error) return gagal('Gagal menyimpan absensi. Coba lagi.');
    return { ok: true, pesan: `Absen masuk ${w.jam.slice(0, 5)} tercatat (${status}). Semangat kerja!` };
  }
  if (a.jam_pulang) return gagal('Absensi hari ini sudah lengkap (masuk dan pulang).');
  await db.from('absensi').update({ jam_pulang: w.jam, latitude_pulang: lat, longitude_pulang: lng, updated_at: new Date().toISOString() }).eq('id', a.id);
  return { ok: true, pesan: `Absen pulang ${w.jam.slice(0, 5)} tercatat. Hati-hati di jalan!` };
}
