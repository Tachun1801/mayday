import { useId, useState } from 'react'
import { useMutation } from '../../shared/use-mutation.js'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
const stages = [['start', 'Khởi phát'], ['peak', 'Đỉnh điểm'], ['normal', 'Bình thường đã ghi nhận']]
const scores = [['diem_ngua_nrs', 'Ngứa NRS'], ['diem_dau_nrs', 'Đau NRS'], ['diem_bong_rat_nrs', 'Bỏng rát NRS'], ['so_luong_not_san', 'Số nốt sẩn đã ghi nhận']]
function timestamp(value) { if (!value) return null; const date = new Date(value); if (!Number.isFinite(date.getTime())) throw new Error('Ngày giờ chưa hợp lệ.'); return date.toISOString() }
function ContextFields({ id, medicationName }) {
  return <>
    <label htmlFor={`${id}-time`}>Ngày giờ xuất hiện (giờ thiết bị)<input id={`${id}-time`} name="thoi_diem_xuat_hien" type="datetime-local" /></label>
    <label htmlFor={`${id}-context`}>Hoàn cảnh xuất hiện<input id={`${id}-context`} name="hoan_canh_xuat_hien" maxLength={255} /></label>
    <label htmlFor={`${id}-other`}>Ghi rõ hoàn cảnh khác (chỉ khi hoàn cảnh là Khac)<textarea id={`${id}-other`} name="hoan_canh_xuat_hien_khac" maxLength={8000} /></label>
    <label htmlFor={`${id}-drug`}>Thuốc liên quan đã ghi nhận<input id={`${id}-drug`} name={medicationName} maxLength={255} /></label>
    <label htmlFor={`${id}-duration`}>Thời gian dùng thuốc trước xuất hiện<input id={`${id}-duration`} name="thoi_gian_dung_thuoc_truoc_khi_xuat_hien" maxLength={100} /></label>
    <label htmlFor={`${id}-unit`}>Đơn vị thời gian đã ghi nhận<input id={`${id}-unit`} name="don_vi_thoi_gian" maxLength={50} /></label>
  </>
}
export function LesionCreateForm({ path, location = false, reload }) {
  const id = useId(), mutation = useMutation(path, 'POST', reload), [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget), data = Object.fromEntries([...form].map(([key, value]) => [key, value || null]))
      data.thoi_diem_xuat_hien = timestamp(data.thoi_diem_xuat_hien)
      setError(''); mutation.save(data)
    } catch (failure) { setError(failure.message) }
  }
  const title = location ? 'Thêm vị trí tổn thương' : 'Tạo đợt tổn thương da'
  return <details><summary>{title}</summary><form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>{title}</legend>
      <label htmlFor={`${id}-name`}>{location ? 'Vị trí cơ thể' : 'Tên đợt tổn thương'}<input id={`${id}-name`} name={location ? 'vi_tri_co_the' : 'ten_dot_ton_thuong_da'} required maxLength={255} /></label>
      <ContextFields id={id} medicationName={location ? 'ten_thuoc_lien_quan' : 'ten_thuoc_dung_gan_thoi_diem_xuat_hien'} />
      {!location && <label htmlFor={`${id}-description`}>Chi tiết đợt tổn thương<textarea id={`${id}-description`} name="chi_tiet_dot_ton_thuong" maxLength={8000} /></label>}
      <button type="submit">Lưu thông tin</button>
    </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
export function LesionPhotoForm({ path, initial, reload }) {
  const id = useId(), editing = Boolean(initial), mutation = useMutation(path, editing ? 'PATCH' : 'POST', reload), [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget), data = {}
      if (!editing) {
        data.ma_tep_dinh_kem = String(form.get('attachment'))
        data.ma_vi_tri_ton_thuong = form.get('location') || null
        data.thoi_diem_chup = timestamp(form.get('taken'))
      }
      if (!editing || form.get('stage') !== initial.moc_tien_trien) data.moc_tien_trien = form.get('stage')
      for (const [field] of scores) {
        const raw = form.get(field), value = raw === '' ? null : Number(raw)
        if (value !== null && (!Number.isInteger(value) || value < 0 || value > (field === 'so_luong_not_san' ? 2147483647 : 10))) throw new Error('Điểm NRS phải từ 0 đến 10; số nốt sẩn là số nguyên không âm.')
        if (!editing || value !== (initial[field] ?? null)) data[field] = value
      }
      if (!Object.keys(data).length) { setError('Chưa có thay đổi để lưu.'); return }
      setError(''); mutation.save(data)
    } catch (failure) { setError(failure.message) }
  }
  return <details><summary>{editing ? 'Cập nhật mốc và triệu chứng đã ghi nhận' : 'Gắn ảnh đã upload vào đợt tổn thương'}</summary>
    <form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}><fieldset disabled={mutation.pending || mutation.requiresReadback}>
      <legend>Ảnh tiến triển</legend>
      {!editing && <>
        <label htmlFor={`${id}-attachment`}>Mã ảnh đính kèm đã upload vào hồ sơ<input id={`${id}-attachment`} name="attachment" required pattern="[1-9][0-9]*" /></label>
        <label htmlFor={`${id}-location`}>Mã vị trí trong đợt (không bắt buộc)<input id={`${id}-location`} name="location" pattern="[1-9][0-9]*" /></label>
        <label htmlFor={`${id}-taken`}>Ngày giờ chụp (giờ thiết bị)<input id={`${id}-taken`} name="taken" type="datetime-local" required /></label>
      </>}
      <label htmlFor={`${id}-stage`}>Mốc tiến triển<select id={`${id}-stage`} name="stage" required defaultValue={initial?.moc_tien_trien || ''}><option value="" disabled>Chọn mốc</option>{stages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {scores.map(([field, label]) => <label key={field} htmlFor={`${id}-${field}`}>{label}<input id={`${id}-${field}`} name={field} type="number" min={0} max={field === 'so_luong_not_san' ? 2147483647 : 10} step={1} defaultValue={initial?.[field] ?? ''} /></label>)}
      <p>Đây là dữ liệu do người dùng ghi nhận; hệ thống không tự tính AUAS hoặc tạo kết quả AI.</p><button type="submit">Lưu ảnh và triệu chứng</button>
    </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} /></form>
  </details>
}
