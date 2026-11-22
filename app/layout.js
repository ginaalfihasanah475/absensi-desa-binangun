import './globals.css';
import { getPengaturan } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const p = await getPengaturan(); return { title: p.nama_aplikasi }; }
export default async function RootLayout({ children }) {
  const p = await getPengaturan();
  return <html lang="id"><body style={{ '--utama': p.warna_utama, '--aksen': p.warna_aksen }}>{children}</body></html>;
}
