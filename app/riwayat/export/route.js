import { getSession } from '@/lib/session';
import { ambil, BULAN } from '@/lib/riwayat';
export const dynamic = 'force-dynamic';
const esc = (v) => { let t = String(v ?? ''); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
export async function GET(req) {
  const s = await getSession();
  if (!s || s.role === 'pegawai') return new Response('Dilarang', { status: 403 });
  const u = new URL(req.url), bulan = u.searchParams.get('bulan') || '';
  if (!BULAN.test(bulan)) return new Response('Bulan tidak valid', { status: 400 });
  const rows = await ambil(s, bulan, String(u.searchParams.get('pegawai') || '').replace(/\D/g, ''));
  const csv = ['Tanggal,Nama,Jam masuk,Jam pulang,Status', ...rows.map((r) => [r.tanggal, r.pegawai?.users?.nama, r.jam_masuk?.slice(0, 5), r.jam_pulang?.slice(0, 5), r.status].map(esc).join(','))].join('\n');
  return new Response('\ufeff' + csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="absensi-${bulan}.csv"` } });
}
