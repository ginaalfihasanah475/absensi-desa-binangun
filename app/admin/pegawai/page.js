import Link from 'next/link';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { catat } from '@/lib/log';
export const dynamic = 'force-dynamic';
const P = '/admin/pegawai';
const galat = (m) => redirect(P + '?e=' + encodeURIComponent(m));
async function cek() { const s = await getSession(); if (s?.role !== 'administrator') redirect('/dashboard'); return s; }
async function tambah(fd) {
  'use server';
  const s = await cek();
  const g = (k, n) => String(fd.get(k) || '').trim().slice(0, n);
  const [nama, nip, jabatan, username] = [g('nama', 150), g('nip', 30), g('jabatan', 100), g('username', 50).toLowerCase()];
  const pw = String(fd.get('password') || '');
  if (!nama || !nip || !jabatan || !/^[a-z0-9._-]{3,50}$/.test(username) || pw.length < 8) galat('Lengkapi data. Username 3-50 huruf/angka, password minimal 8 karakter.');
  const { data: u, error } = await db.from('users').insert({ nama, username, password: await bcrypt.hash(pw, 10), role: 'pegawai' }).select('id').single();
  if (error) galat('Username sudah dipakai.');
  const { error: e2 } = await db.from('pegawai').insert({ id_users: u.id, nip, jabatan, alamat: g('alamat', 500), no_hp: g('no_hp', 20), tanggal_mulai_kerja: g('mulai', 10) || null });
  if (e2) { await db.from('users').delete().eq('id', u.id); galat('NIP sudah terdaftar (termasuk milik pegawai yang pernah dihapus).'); }
  await catat(s.id, 'tambah', 'pegawai', `Menambah pegawai ${nama}`);
  redirect(P + '?ok=1');
}
async function hapus(fd) {
  'use server';
  const s = await cek(), now = new Date().toISOString();
  const { data: p } = await db.from('pegawai').update({ deleted_at: now }).eq('id', fd.get('id')).select('id_users').maybeSingle();
  if (p) { await db.from('users').update({ deleted_at: now }).eq('id', p.id_users); await catat(s.id, 'hapus', 'pegawai', `Menghapus pegawai id ${fd.get('id')}`); }
  redirect(P);
}
async function reset(fd) {
  'use server';
  const s = await cek(), pw = String(fd.get('password') || '');
  if (pw.length < 8) galat('Password baru minimal 8 karakter.');
  const { data: p } = await db.from('pegawai').select('id_users').eq('id', fd.get('id')).maybeSingle();
  if (p) { await db.from('users').update({ password: await bcrypt.hash(pw, 10), updated_at: new Date().toISOString() }).eq('id', p.id_users); await catat(s.id, 'reset', 'pegawai', `Reset password pegawai id ${fd.get('id')}`); }
  redirect(P + '?ok=1');
}
export default async function Halaman({ searchParams }) {
  await cek();
  const { data: list } = await db.from('pegawai').select('id,nip,jabatan,no_hp,users(nama,username)').is('deleted_at', null).order('id');
  return (
    <main className="wrap narrow">
      <Link href="/dashboard" className="back">← Dashboard</Link>
      <h1>Data Pegawai</h1>
      {searchParams?.ok && <div className="ok">Berhasil disimpan ✅</div>}
      {searchParams?.e && <div className="err">{searchParams.e}</div>}
      <div className="card">
        {(list || []).map((p) => (
          <div className="row" key={p.id}>
            <div><b>{p.users?.nama}</b><br /><small className="muted">@{p.users?.username} · {p.jabatan}<br />NIP {p.nip}{p.no_hp ? ` · ${p.no_hp}` : ''}</small></div>
            <div className="acts">
              <form action={reset} className="mini"><input type="hidden" name="id" value={p.id} /><input name="password" type="password" placeholder="Password baru" /><button className="ghost">Reset</button></form>
              <form action={hapus}><input type="hidden" name="id" value={p.id} /><button className="ghost">Hapus</button></form>
            </div>
          </div>
        ))}
        {!list?.length && <p className="muted">Belum ada pegawai.</p>}
      </div>
      <form action={tambah} className="card">
        <h3>Tambah pegawai</h3>
        <label>Nama lengkap<input name="nama" required /></label>
        <div className="duo">
          <label>Username<input name="username" required placeholder="huruf kecil" /></label>
          <label>Password<input name="password" type="password" required minLength={8} /></label>
        </div>
        <div className="duo">
          <label>NIP<input name="nip" required /></label>
          <label>Jabatan<input name="jabatan" required /></label>
        </div>
        <div className="duo">
          <label>No. HP<input name="no_hp" /></label>
          <label>Mulai kerja<input name="mulai" type="date" /></label>
        </div>
        <label>Alamat<input name="alamat" /></label>
        <button>Simpan pegawai</button>
      </form>
    </main>
  );
}
