import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { catat } from '@/lib/log';
import { unggah, urlBukti } from '@/lib/simpan';
export const dynamic = 'force-dynamic';
async function cek() { const s = await getSession(); if (s?.role !== 'administrator') redirect('/dashboard'); return s; }
async function simpan(fd) {
  'use server';
  const s = await cek(), id = Number(fd.get('id')), B = `/admin/pegawai/${id}`;
  const galat = (m) => redirect(B + '?e=' + encodeURIComponent(m));
  const g = (k, n) => String(fd.get(k) || '').trim().slice(0, n);
  const nama = g('nama', 150), nip = g('nip', 30), jabatan = g('jabatan', 100);
  if (!nama || !nip || !jabatan) galat('Nama, NIP, dan jabatan wajib diisi.');
  const { data: pg } = await db.from('pegawai').select('id_users,foto').eq('id', id).is('deleted_at', null).maybeSingle();
  if (!pg) redirect('/admin/pegawai');
  const baru = { nip, jabatan, alamat: g('alamat', 500), no_hp: g('no_hp', 20), tanggal_mulai_kerja: g('mulai', 10) || null, updated_at: new Date().toISOString() };
  const f = fd.get('foto');
  if (f && f.size > 0) {
    if (!f.type.startsWith('image/')) galat('Foto harus berupa gambar.');
    const u = await unggah(f, 'foto');
    if (u.error) galat(u.error);
    baru.foto = u.path;
  }
  const { error } = await db.from('pegawai').update(baru).eq('id', id);
  if (error) galat('NIP sudah dipakai pegawai lain.');
  if (baru.foto && pg.foto) await db.storage.from('bukti').remove([pg.foto]);
  await db.from('users').update({ nama, updated_at: baru.updated_at }).eq('id', pg.id_users);
  await catat(s.id, 'ubah', 'pegawai', `Mengubah data pegawai ${nama}`);
  redirect(B + '?ok=1');
}
export default async function Halaman({ params, searchParams }) {
  await cek();
  const { data: p } = await db.from('pegawai').select('*,users(nama,username)').eq('id', params.id).is('deleted_at', null).maybeSingle();
  if (!p) notFound();
  const foto = await urlBukti(p.foto);
  return (
    <main className="wrap narrow">
      <h1>Edit pegawai</h1>
      <div style={{ gridColumn: '1/-1' }}><Link href="/admin/pegawai" className="btn">← Daftar pegawai</Link></div>
      <form action={simpan} className="card" style={{ gridColumn: '1/-1', maxWidth: 640 }}>
        {searchParams?.ok && <div className="ok">Data disimpan ✅</div>}
        {searchParams?.e && <div className="err">{searchParams.e}</div>}
        <input type="hidden" name="id" value={p.id} />
        <div className="orang">
          {foto ? <img src={foto} alt="" className="fotobesar" /> : <div className="fotobesar fav">{p.users?.nama?.[0]}</div>}
          <label style={{ flex: 1 }}>Foto (gambar, maks 2 MB)<input type="file" name="foto" accept="image/*" /></label>
        </div>
        <label>Nama lengkap<input name="nama" defaultValue={p.users?.nama} required /></label>
        <label>Username<input value={p.users?.username || ''} disabled /></label>
        <div className="duo"><label>NIP<input name="nip" defaultValue={p.nip} required /></label><label>Jabatan<input name="jabatan" defaultValue={p.jabatan} required /></label></div>
        <div className="duo"><label>No. HP<input name="no_hp" defaultValue={p.no_hp || ''} /></label><label>Mulai kerja<input name="mulai" type="date" defaultValue={p.tanggal_mulai_kerja || ''} /></label></div>
        <label>Alamat<input name="alamat" defaultValue={p.alamat || ''} /></label>
        <button>Simpan perubahan</button>
      </form>
    </main>
  );
}
