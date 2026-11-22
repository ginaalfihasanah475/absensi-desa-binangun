import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { redirect } from 'next/navigation';
import { getPengaturan, logoUrl } from '@/lib/db';
import { getSession, clearSession } from '@/lib/session';
import Shell from './shell';
const font = Plus_Jakarta_Sans({ subsets: ['latin'] });
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const p = await getPengaturan(); return { title: p.nama_aplikasi }; }
async function keluar() { 'use server'; clearSession(); redirect('/login'); }
export default async function RootLayout({ children }) {
  const [p, s] = [await getPengaturan(), await getSession()];
  return (
    <html lang="id">
      <body className={font.className} style={{ '--utama': p.warna_utama, '--aksen': p.warna_aksen }}>
        <Shell user={s ? { nama: s.nama, role: s.role } : null} nama={p.nama_aplikasi} logo={logoUrl(p)} keluar={}>{children}</Shell>
      </body>
    </html>
  );
}
