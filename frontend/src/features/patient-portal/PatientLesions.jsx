import { useId, useState } from 'react'
import { useResource } from '../../shared/use-resource.js'
import { useMutation } from '../../shared/use-mutation.js'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { FieldDetails, Pagination, RemoteTable, ResourceState } from '../../shared/ui/DataView.jsx'
import { PrivateImage } from '../media/MediaPanel.jsx'
import { LesionPhotoForm } from '../medical-records/LesionForms.jsx'

export function PatientLesions({ recordPath, writable }) {
  const [version, setVersion] = useState(0), reload = () => setVersion((value) => value + 1)
  return <section key={version} aria-label="Theo dõi tổn thương của tôi"><h2>Theo dõi tổn thương da</h2>
    {writable && <LesionNameForm path={`${recordPath}/lesions`} reload={reload} />}
    <RemoteTable title="Các đợt tổn thương" path={`${recordPath}/lesions`} idField="ma_dot_ton_thuong_da" columns={[
      ['ten_dot_ton_thuong_da', 'Tên đợt'], ['thoi_diem_xuat_hien', 'Thời điểm xuất hiện'],
    ]} renderDetails={(episode) => <PatientEpisode key={episode.ma_dot_ton_thuong_da} recordPath={recordPath} path={`${recordPath}/lesions/${encodeURIComponent(episode.ma_dot_ton_thuong_da)}`} writable={writable} />} />
  </section>
}
function PatientEpisode({ recordPath, path, writable }) {
  const [version, setVersion] = useState(0), reload = () => setVersion((value) => value + 1)
  return <div key={version}>
    {writable && <LesionNameForm path={`${path}/locations`} location reload={reload} />}
    <RemoteTable title="Vị trí tổn thương" path={`${path}/locations`} idField="ma_vi_tri_ton_thuong" columns={[
      ['vi_tri_co_the', 'Vị trí cơ thể'], ['thoi_diem_xuat_hien', 'Thời điểm xuất hiện'],
    ]} />
    {writable && <PatientPhotoForm path={`${path}/photos`} recordPath={recordPath} locationPath={`${path}/locations`} reload={reload} />}
    <RemoteTable title="Ảnh tiến triển và triệu chứng" path={`${path}/photos`} idField="ma_anh" columns={[
      ['thoi_diem_chup', 'Ngày giờ chụp'], ['moc_tien_trien', 'start: khởi phát / peak: đỉnh / normal: bình thường'], ['diem_ngua_nrs', 'Ngứa NRS'],
    ]} renderDetails={(photo) => <>
      <FieldDetails record={photo} fields={[["diem_dau_nrs", 'Đau NRS'], ['diem_bong_rat_nrs', 'Bỏng rát NRS'], ['so_luong_not_san', 'Số nốt sẩn đã ghi nhận']]} />
      <PrivateImage path={`${recordPath}/attachments/${encodeURIComponent(photo.ma_tep_dinh_kem)}/content`} />
      {writable && <LesionPhotoForm path={`${path}/photos/${encodeURIComponent(photo.ma_anh)}`} initial={photo} reload={reload} />}
    </>} />
  </div>
}

export function LesionNameForm({ path, location = false, reload }) {
  const id = useId(), title = location ? 'Thêm vị trí trên cơ thể' : 'Ghi nhận đợt tổn thương mới'
  const mutation = useMutation(path, 'POST', reload)
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.save(location ? { vi_tri_co_the: String(form.get('name')).trim() } : { ten_dot_ton_thuong_da: String(form.get('name')).trim(), chi_tiet_dot_ton_thuong: form.get('description') || null })
  }
  return <details><summary>{title}</summary><form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>{title}</legend>
      <label htmlFor={`${id}-name`}>{location ? 'Vị trí cơ thể' : 'Tên đợt tổn thương'}<input id={`${id}-name`} name="name" required maxLength={255} /></label>
      {!location && <label htmlFor={`${id}-description`}>Ghi chú của bạn<textarea id={`${id}-description`} name="description" maxLength={8000} /></label>}
      <button type="submit">Lưu ghi nhận</button>
    </fieldset><MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}

// Each choice is paginated instead of truncating a patient's files/locations.
// The patient selects persisted items; no raw storage locator or owner ID input.
function PagedChoice({ path, name, label, idField, textField, required = false, images = false }) {
  const id = useId(), [page, setPage] = useState(1), [selected, setSelected] = useState(null)
  const state = useResource(`${path}?page=${page}&limit=20`)
  const items = Array.isArray(state.data?.items) ? state.data.items.filter((item) => !images || ['jpg', 'png', 'webp'].includes(item.dinh_dang_tep)) : []
  return <div><label htmlFor={id}>{label}<select id={id} name={name} required={required} value={selected?.id || ''} onChange={(event) => {
    const item = items.find((row) => String(row[idField]) === event.target.value)
    setSelected(item ? { id: String(item[idField]), label: item[textField] || 'Đã chọn' } : null)
  }}><option value="">{required ? 'Chọn ảnh đã tải lên hồ sơ' : 'Chưa chọn vị trí'}</option>
    {selected && !items.some((item) => String(item[idField]) === selected.id) && <option value={selected.id}>{selected.label}</option>}
    {items.map((item) => <option key={item[idField]} value={String(item[idField])}>{item[textField] || 'Không có tên'}</option>)}
  </select></label><ResourceState {...state} />
    {!state.loading && !state.error && <Pagination page={page} total={state.data?.total} onChange={setPage} title={label} />}
  </div>
}

export function PatientPhotoForm({ path, recordPath, locationPath, reload }) {
  const id = useId(), mutation = useMutation(path, 'POST', reload), [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget), time = new Date(String(form.get('taken')))
    if (!Number.isFinite(time.getTime())) { setError('Vui lòng nhập ngày giờ chụp hợp lệ.'); return }
    setError('')
    mutation.save({ ma_tep_dinh_kem: String(form.get('attachment')), ma_vi_tri_ton_thuong: form.get('location') || null,
      thoi_diem_chup: time.toISOString(), moc_tien_trien: String(form.get('stage')) })
  }
  return <details><summary>Thêm ảnh tiến triển vào đợt này</summary><p>Tải ảnh ở mục ảnh đính kèm phía trên, sau đó chọn ảnh để gắn vào đợt tổn thương. Có thể cập nhật điểm triệu chứng sau khi lưu.</p>
    <form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}><fieldset disabled={mutation.pending || mutation.requiresReadback}>
      <legend>Ảnh của đợt tổn thương</legend>
      <PagedChoice path={`${recordPath}/attachments`} name="attachment" label="Ảnh đã tải lên hồ sơ" idField="id" textField="ten_tep_goc" required images />
      <PagedChoice path={locationPath} name="location" label="Vị trí trong đợt này" idField="ma_vi_tri_ton_thuong" textField="vi_tri_co_the" />
      <label htmlFor={`${id}-taken`}>Ngày giờ chụp (giờ thiết bị)<input id={`${id}-taken`} name="taken" type="datetime-local" required /></label>
      <label htmlFor={`${id}-stage`}>Mốc tiến triển<select id={`${id}-stage`} name="stage" required defaultValue=""><option value="" disabled>Chọn mốc</option><option value="start">Khởi phát</option><option value="peak">Đỉnh điểm</option><option value="normal">Bình thường đã ghi nhận</option></select></label>
      <button type="submit">Lưu ảnh tiến triển</button>
    </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} /></form>
  </details>
}
