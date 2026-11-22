import { getPengaturan } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  const p = await getPengaturan(), v = encodeURIComponent(p.logo_path || '0');
  const m = {
    name: p.nama_aplikasi, short_name: p.nama_aplikasi.slice(0, 12), description: p.tagline || '',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait', lang: 'id',
    background_color: '#f2f5f9', theme_color: p.warna_utama,
    icons: [
      { src: `/icon/192?v=${v}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icon/512?v=${v}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/icon/512?v=${v}&m=1`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [{ name: 'Absen', url: '/absen' }, { name: 'Riwayat', url: '/riwayat' }],
  };
  return new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' } });
}
