import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const awal = { nama_aplikasi: 'Absensi Desa', nama_instansi: '', tagline: '', warna_utama: '#0f766e', warna_aksen: '#f59e0b' };
export const getPengaturan = cache(async () => {
  const { data } = await db.from('pengaturan').select('*').eq('id', 1).maybeSingle();
  return data || awal;
});
export const logoUrl = (p) => p?.logo_path ? `${process.env.SUPABASE_URL}/storage/v1/object/public/branding/${p.logo_path}` : null;
