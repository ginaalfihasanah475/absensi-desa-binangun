import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db, getPengaturan, logoUrl } from '@/lib/db';
import { getSession } from '@/lib/session';
import Form from './form';
export const dynamic = 'force-dynamic';
const HEX = /^#[0-9a-fA-F]{6}$/;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
async function simpan(fd) {
  'use server';
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const t = (k, n) => String(fd.get(k) || '').trim().slice(0, n);
  const [u, a] = [t('warna_utama', 9), t('warna_aksen', 9)];
  if (!HEX.test(u) || !HEX.test(a)) redirect('/admin/pengaturan?e=' + encodeURIComponent('Format warna tidak valid.'));
  const baru = { id: 1, nama_aplikasi: t('nama_aplikasi', 100) || 'Absensi Desa', nama_instansi: t('nama_instansi', 150), tagline: t('tagline', 200), warna_utama: u, warna_aksen: a, updated_at: new Date().toISOString() };
  const f = fd.get('logo');
  if (f && f.size > 0) {
    if (!EXT[f.type] || f.size > 1048576) redirect('/admin/pengaturan?e=' + encodeURIComponent('Logo harus PNG/JPG/WebP dan maksimal 1 MB.'));
    await db.storage.createBucket('branding', { public: true });
    const path = `logo-${Date.now()}.${EXT[f.type]}`;
    const { error } = await db.storage.from('branding').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
    if (error) redirect('/admin/pengaturan?e=' + encodeURIComponent('Gagal mengunggah logo: ' + error.message));
    const lama = (await getPengaturan()).logo_path;
    if (lama) await db.storage.from('branding').remove([lama]);
    baru.logo_path = path;
  }
  await db.from('pengaturan').upsert(baru);
  redirect('/admin/pengaturan?ok=1');
}
export default async function Halaman({ searchParams }) {
  const s = await getSession();
  if (s?.role !== 'administrator') redirect('/dashboard');
  const p = await getPengaturan();
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      <h1>Pengaturan Tampilan</h1>
      <p className="muted">Ubah logo, nama, dan warna. Langsung berlaku di seluruh aplikasi.</p>
      <Form p={p} logo={logoUrl(p)} action={simpan} ok={!!searchParams?.ok} err={searchParams?.e} />
    </main>
  );
}
