import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { inputValue, changedFields } from './clinical-form.js'
import { useMutation } from '../../shared/use-mutation.js'
import { useId, useState } from 'react'
import { useResource } from '../../shared/use-resource.js'
import { ResourceState } from '../../shared/ui/DataView.jsx'
import { editorFields } from './editor-fields.js'

export function FixedFields({ table, initial = {}, prefix = '' }) {
  const id = useId()
  return <>{Object.entries(editorFields[table]).map(([field, rule]) => {
    const name = `${prefix}${field}`, inputId = `${id}-${name}`, value = inputValue(initial[field], rule)
    return <label key={field} htmlFor={inputId}>{rule.label}
      {rule.options || rule.type === 'boolean'
        ? <select id={inputId} name={name} defaultValue={value}><option value="">Chưa ghi nhận</option>
          {(rule.options || ['true', 'false']).map((option) => <option key={option} value={option}>{rule.type === 'boolean' ? option === 'true' ? 'Có' : 'Không' : option}</option>)}
        </select>
        : rule.type === 'text'
          ? <textarea id={inputId} name={name} defaultValue={value} maxLength={rule.maxLength || 8000} rows={2} />
          : <input id={inputId} name={name} defaultValue={value} type={rule.type === 'date' ? 'date' : rule.type === 'integer' ? 'number' : 'text'}
            step={rule.type === 'integer' ? 1 : undefined} min={rule.type === 'integer' ? rule.min : undefined} max={rule.type === 'integer' ? rule.max : undefined}
            inputMode={['integer', 'decimal'].includes(rule.type) ? 'decimal' : undefined} maxLength={80}
            placeholder={rule.type === 'interval' ? 'P1D = 1 ngày; PT2H = 2 giờ' : rule.type === 'timestamp' ? '2026-11-07T09:00:00+07:00' : undefined} />}
    </label>
  })}</>
}
export function ContentEditor({ title, path, groups, reload }) {
  const [localError, setLocalError] = useState('')
  const mutation = useMutation(path, 'PATCH', reload)
  function submit(event) {
    event.preventDefault()
    if (mutation.pending || mutation.requiresReadback) return
    const form = new FormData(event.currentTarget)
    let data
    try { data = Object.fromEntries(groups.map((group) => [group.key, changedFields(form, `${group.key}.`, editorFields[group.table], group.initial)])) }
    catch (failure) { setLocalError(failure.message); return }
    if (!Object.values(data).some((value) => Object.keys(value).length)) { setLocalError('Chưa có thay đổi để lưu.'); return }
    setLocalError('')
    mutation.save(data)
  }
  return <details><summary>{title}</summary><form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <p>Chỉ lưu những trường đã thay đổi. Để trống sẽ xóa nội dung trường đó. Lựa chọn Có/Khác cần chi tiết tương ứng; khi đổi sang Không/Chưa ghi nhận, hãy xóa chi tiết cũ.</p>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}>
      {groups.map((group) => <fieldset key={group.key}><legend>{group.label}</legend><FixedFields table={group.table} prefix={`${group.key}.`} initial={group.initial} /></fieldset>)}
      <button type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu nội dung'}</button>
    </fieldset>
    {localError && <p role="alert">{localError}</p>}
    <MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
export function VisitCreateForm({ recordPath, patientPath, reload, onCreated }) {
  const mutation = useMutation(patientPath ? `${patientPath}/intakes` : `${recordPath}/visits`, 'POST', (data) => {
    const value = patientPath ? data.record_id : data.visit_id
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) throw new Error('Cần đọc lại dữ liệu để xác nhận hồ sơ/phiên vừa tạo.')
    const saved = onCreated || reload
    saved(data)
  })
  const id = useId()
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const visit = { ngay_kham: form.get('date'), ma_phong_kham: form.get('room') || null }
    mutation.save(patientPath ? { record: { loai_benh_an: form.get('type') }, visit } : visit)
  }
  return <details><summary>{patientPath ? 'Tạo hồ sơ mới cho bệnh nhân này' : 'Tạo phiên tái khám'}</summary>
    <form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
      <fieldset disabled={mutation.pending || mutation.requiresReadback}>
        {patientPath && <label htmlFor={`${id}-type`}>Loại bệnh án<select id={`${id}-type`} name="type" required><option value="CAP">Mề đay cấp</option><option value="MAN">Mề đay mạn</option></select></label>}
        <label htmlFor={`${id}-date`}>Ngày khám<input id={`${id}-date`} name="date" type="date" required /></label>
        <label htmlFor={`${id}-room`}>Mã phòng khám (không bắt buộc)<input id={`${id}-room`} name="room" inputMode="numeric" pattern="[1-9][0-9]*" /></label>
        <p>Bác sĩ được lấy từ tài khoản hiện tại; phòng phải thuộc cùng chi nhánh. Chỉ thao tác trên bệnh nhân/hồ sơ đã được phân công.</p>
        <button type="submit">{mutation.pending ? 'Đang tạo…' : 'Tạo và đọc lại hồ sơ'}</button>
      </fieldset><MutationStatus mutation={mutation} reload={reload} />
    </form>
  </details>
}
const sectionTables = { 'personal-history': 'tiensubanthan', 'previous-episodes': 'benhsucacdotbenhtruoc', 'allergy-context': 'hoancanhkhoiphatdiung', infections: 'tinhtrangnhiemtrung' }
export function HistoryEditor({ path, section }) {
  const state = useResource(`${path}?page=1&limit=1`)
  if (state.loading || state.error) return <ResourceState {...state} />
  return <HistoryForm key={state.data?.items?.[0]?.[section.id] || 'new'} path={path} table={sectionTables[section.path]} initial={state.data?.items?.[0] || {}} reload={state.retry} />
}
function HistoryForm({ path, table, initial, reload }) {
  const mutation = useMutation(path, 'PATCH', reload)
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    let data
    try { data = changedFields(new FormData(event.currentTarget), '', editorFields[table], initial) }
    catch (failure) { setError(failure.message); return }
    if (!Object.keys(data).length) { setError('Chưa có thay đổi để lưu.'); return }
    setError(''); mutation.save(data)
  }
  return <form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Cập nhật dữ liệu đã ghi nhận</legend><FixedFields table={table} initial={initial} /><button type="submit">Lưu thông tin</button></fieldset>
    {error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form>
}
export { MutationStatus }
