import { db } from './db';
export const catat = (id, aksi, modul, ket) => db.from('audit_trail').insert({ id_users: id, aksi, modul, keterangan: ket });
