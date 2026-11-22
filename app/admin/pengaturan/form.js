'use client';
import { useState } from 'react';
const PRESET = [['Hijau Desa', '#0f766e', '#f59e0b'], ['Biru Laut', '#1d4ed8', '#f97316'], ['Ungu Senja', '#7c3aed', '#ec4899'], ['Merah Berani', '#be123c', '#facc15'], ['Cokelat Tanah', '#92400e', '#16a34a']];
export default function Form({ p, logo, action, ok, err }) {
  const [u, setU] = useState(p.warna_utama), [a, setA] = useState(p.warna_aksen);
  const [nama, setNama] = useState(p.nama_aplikasi), [tag, setTag] = useState(p.tagline), [img, setImg] = useState(logo);
  return (
    <form action={action} className="card">
      <div className="prev" style={{ '--utama': u, '--aksen': a }}>
        {img ? <img src={img} alt="" className="logo" /> : <div className="logo mark">{(nama || 'A')[0]}</div>}
        <b>{nama || 'Nama aplikasi'}</b><small>{tag}</small>
        <span className="chip">Pratinjau</span>
        <button type="button">Tombol contoh</button>
      </div>
      {ok && <div className="ok">Pengaturan disimpan ✅</div>}
      {err && <div className="err">{err}</div>}
      <label>Tema cepat
        <div className="swatch">{PRESET.map(([n, x, y]) => (
          <button type="button" key={n} title={n} className="ghost" onClick={() => { setU(x); setA(y); }}
            style={{ background: `linear-gradient(135deg,${x} 50%,${y} 50%)`, width: 44, height: 44 }} />))}
        </div>
      </label>
      <div className="duo">
        <label>Warna utama<input type="color" name="warna_utama" value={u} onChange={(e) => setU(e.target.value)} /></label>
        <label>Warna aksen<input type="color" name="warna_aksen" value={a} onChange={(e) => setA(e.target.value)} /></label>
      </div>
      <label>Nama aplikasi<input name="nama_aplikasi" value={nama} onChange={(e) => setNama(e.target.value)} required maxLength={100} /></label>
      <label>Nama instansi<input name="nama_instansi" defaultValue={p.nama_instansi} maxLength={150} /></label>
      <label>Tagline<input name="tagline" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={200} /></label>
      <label>Logo (PNG/JPG/WebP, maks 1 MB)
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => { const f = e.target.files[0]; if (f) setImg(URL.createObjectURL(f)); }} />
      </label>
      <button>Simpan pengaturan</button>
    </form>
  );
}
