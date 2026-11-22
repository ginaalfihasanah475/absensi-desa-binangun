export function waktu() {
  const d = new Date(), tz = { timeZone: 'Asia/Jakarta' };
  return {
    tanggal: d.toLocaleDateString('en-CA', tz),
    jam: d.toLocaleTimeString('en-GB', { ...tz, hour12: false }),
    hari: d.toLocaleDateString('id-ID', { ...tz, weekday: 'long' }),
  };
}
