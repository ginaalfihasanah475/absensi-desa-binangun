import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db, getPengaturan, logoUrl } from '@/lib/db';
import { setSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
async function masuk(fd) {
  'use server';
  const username = String(fd.get('username') || '').trim().toLowerCase();
  const { data: u } = await db.from('users').select('*').eq('username', username).is('deleted_at', null).maybeSingle();
  if (!u || !(await bcrypt.compare(String(fd.get('password') || ''), u.password))) redirect('/login?e=1');
  await setSession(u);
  await db.from('audit_trail').insert({ id_users: u.id, aksi: 'login', modul: 'auth', keterangan: `${u.nama} masuk ke sistem` });
  redirect('/dashboard');
}
export default async function Login({ searchParams }) {
  const p = await getPengaturan(); const logo = logoUrl(p);
  return (
    <main className="login">
      <section className="hero">
        <div className="blob b1" /><div className="blob b2" />
        {logo ? <img src={logo} alt="" className="logo" /> : <div className="logo mark">{p.nama_aplikasi[0]}</div>}
        <h1>{p.nama_aplikasi}</h1><p>{p.tagline}</p><small>{p.nama_instansi}</small>
      </section>
      <section className="panel">
        <form action={masuk} className="card">
          <h2>Selamat datang 👋</h2><p className="muted">Masuk untuk mulai absen</p>
          {searchParams?.e && <div className="err">Username atau password salah</div>}
          <label>Username<input name="username" required autoFocus /></label>
          <label>Password<input name="password" type="password" required /></label>
          <button>Masuk</button>
        </form>
      </section>
    </main>
  );
}
