const definitions = {
  episode: ['dottonthuongda', 'ma_dot_ton_thuong_da'], location: ['vitritonthuong', 'ma_vi_tri_ton_thuong'], photo: ['anhchuptonthuong', 'ma_anh'],
};
async function insert(client, kind, fixed, input) {
  const [table, key] = definitions[kind], entries = [...Object.entries(fixed), ...Object.entries(input)];
  const { rows } = await client.query(`INSERT INTO public.${table} (${entries.map(([field]) => field).join(', ')})
    VALUES (${entries.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING ${key}::text AS id`, entries.map(([, value]) => value));
  return rows[0];
}
async function episode(client, recordId, episodeId) {
  const { rows } = await client.query('SELECT ma_dot_ton_thuong_da FROM public.dottonthuongda WHERE ma_ho_so_man = $1 AND ma_dot_ton_thuong_da = $2 FOR UPDATE', [recordId, episodeId]);
  return rows[0] || null;
}
async function location(client, episodeId, locationId) {
  const { rows } = await client.query('SELECT ma_vi_tri_ton_thuong FROM public.vitritonthuong WHERE ma_dot_ton_thuong_da = $1 AND ma_vi_tri_ton_thuong = $2 FOR SHARE', [episodeId, locationId]);
  return rows[0] || null;
}
async function attachment(client, recordId, attachmentId) {
  const { rows } = await client.query(`SELECT ma_tep_dinh_kem FROM public.tepdinhkem WHERE ma_ho_so = $1
    AND ma_tep_dinh_kem = $2 AND loai_phuong_tien = 'image' FOR SHARE`, [recordId, attachmentId]);
  return rows[0] || null;
}
async function updatePhoto(client, recordId, episodeId, photoId, input) {
  const entries = Object.entries(input);
  const { rows } = await client.query(`UPDATE public.anhchuptonthuong a SET ${entries.map(([field], i) => `${field} = $${i + 4}`).join(', ')}
    WHERE a.ma_dot_ton_thuong_da = $1 AND a.ma_anh = $2
    AND EXISTS (SELECT 1 FROM public.tepdinhkem t WHERE t.ma_tep_dinh_kem = a.ma_tep_dinh_kem AND t.ma_ho_so = $3 AND t.loai_phuong_tien = 'image')
    RETURNING a.ma_anh::text AS id`, [episodeId, photoId, recordId, ...entries.map(([, value]) => value)]);
  return rows[0] || null;
}
module.exports = { insert, episode, location, attachment, updatePhoto };
