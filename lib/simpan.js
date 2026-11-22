import { db } from './db';
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf' };
export async function unggah(f, folder) {
  if (!f || !f.size) return { path: null };
  if (!EXT[f.type] || f.size > 2097152) return { error: 'File harus PNG/JPG/WebP/PDF dan maksimal 2 MB.' };
  await db.storage.createBucket('bukti', { public: false });
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${EXT[f.type]}`;
  const { error } = await db.storage.from('bukti').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
  return error ? { error: 'Gagal mengunggah: ' + error.message } : { path };
}
export async function urlBukti(path) {
  if (!path) return null;
  const { data } = await db.storage.from('bukti').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}
