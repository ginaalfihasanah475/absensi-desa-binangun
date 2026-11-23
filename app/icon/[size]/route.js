import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
const UKURAN = [180, 192, 512];
async function pengaturan() {
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/pengaturan?id=eq.1&select=logo_path,warna_utama,nama_aplikasi`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY }, cache: 'no-store' });
    return (await r.json())[0] || {};
  } catch { return {}; }
}
async function logoData(path) {
  if (!path) return null;
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/public/branding/${path}`);
    const t = r.headers.get('content-type') || '';
    if (!r.ok || !/image\/(png|jpeg)/.test(t)) return null;
    let b = '';
    new Uint8Array(await r.arrayBuffer()).forEach((x) => (b += String.fromCharCode(x)));
    return `data:${t};base64,${btoa(b)}`;
  } catch { return null; }
}
export async function GET(req, { params }) {
  const size = UKURAN.includes(+params.size) ? +params.size : 192;
  const maskable = new URL(req.url).searchParams.get('m') === '1';
  const p = await pengaturan(), logo = await logoData(p.logo_path);
  const warna = /^#[0-9a-fA-F]{6}$/.test(p.warna_utama) ? p.warna_utama : '#0f766e';
  const dalam = Math.round(size * (maskable ? 0.52 : 0.7));
  return new ImageResponse(
    (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: warna }}>
      {logo ? <div style={{ width: dalam, height: dalam, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: dalam * 0.22 }}><img src={logo} width={Math.round(dalam * 0.82)} height={Math.round(dalam * 0.82)} style={{ objectFit: 'contain' }} /></div>
        : <div style={{ display: 'flex', color: '#fff', fontSize: dalam, fontWeight: 800 }}>{(p.nama_aplikasi || 'A')[0].toUpperCase()}</div>}
    </div>),
    { width: size, height: size });
}
