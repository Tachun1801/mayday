import { useId, useState } from 'react'
import { FixedFields, MutationStatus } from './ClinicalEditor.jsx'
import { changedFields } from './clinical-form.js'
import { useMutation } from '../../shared/use-mutation.js'
import { editorFields } from './editor-fields.js'

export function LabEntry({ path, type, reload }) {
  const mutation = useMutation(`${path}/labs`, 'POST', reload)
  const [error, setError] = useState('')
  const subtype = type === 'CAP' ? 'ketquacanlamsangcap' : 'ketquacanlamsangman'
  function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = changedFields(data, 'result.', editorFields.ketquacanlamsang, {})
    const detail = changedFields(data, 'detail.', editorFields[subtype], {})
    if (!Object.keys(result).length && !Object.keys(detail).length) { setError('Nhập ít nhất một kết quả trước khi lưu.'); return }
    setError(''); mutation.save({ result, detail })
  }
  return <details><summary>Nhập kết quả cận lâm sàng {type === 'CAP' ? 'cấp' : 'mạn'}</summary>
    <form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
      <p>Lưu kết quả đã có. Các chỉ số tính toán do database cung cấp; biểu mẫu không tạo phiếu chỉ định xét nghiệm.</p>
      <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Kết quả đã đo</legend>
        <FixedFields table="ketquacanlamsang" prefix="result." /><FixedFields table={subtype} prefix="detail." />
        <button type="submit">Lưu kết quả</button>
      </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
    </form>
  </details>
}
export function ObservationEntry({ path, type, reload }) {
  const table = type === 'CAP' ? 'chitiettonthuongcaptinh' : 'chitiettonthuongsanphu'
  return <><ObservationForm path={`${path}/details/vitals`} table="dauhieusinhton" title="Thêm lần ghi nhận sinh hiệu" reload={reload} />
    <ObservationForm path={`${path}/details/${type === 'CAP' ? 'acute-lesions' : 'chronic-lesions'}`} table={table} title="Thêm mô tả tổn thương trong phiên" reload={reload} /></>
}
function ObservationForm({ path, table, title, reload }) {
  const mutation = useMutation(path, 'POST', reload)
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    let data
    try { data = changedFields(new FormData(event.currentTarget), '', editorFields[table], {}) }
    catch (failure) { setError(failure.message); return }
    if (!Object.keys(data).length) { setError('Chưa nhập nội dung để lưu.'); return }
    setError(''); mutation.save(data)
  }
  return <details><summary>{title}</summary><form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>{title}</legend><FixedFields table={table} /><button type="submit">Lưu lần ghi nhận</button></fieldset>
    {error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
export function PrescriptionEntry({ path, reload }) {
  const id = useId()
  const [rows, setRows] = useState([0])
  const [stops, setStops] = useState([])
  const [sequence, setSequence] = useState(1)
  const mutation = useMutation(`${path}/prescriptions`, 'POST', reload)
  function add(setter) { setter((items) => [...items, sequence]); setSequence((value) => value + 1) }
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (name) => String(form.get(name) || '').trim()
    mutation.save({ ngay_ke_don: get('date'), ghi_chu_dieu_tri: get('note') || null,
      items: rows.map((row) => ({ ma_thuoc: get(`drug-${row}`) || null, ten_thuoc_bo_sung: get(`name-${row}`) || null, lieu_dung: get(`dose-${row}`), thoi_gian_dung: get(`duration-${row}`) })),
      stop_instructions: stops.map((row) => ({ thuoc_can_ngung: get(`stop-drug-${row}`), ngung_tu_ngay: get(`stop-date-${row}`) || null,
        thoi_gian_ngung_ngay: get(`stop-days-${row}`) ? Number(get(`stop-days-${row}`)) : null, muc_dich: get(`purpose-${row}`) || null, muc_dich_khac_ghi_ro: get(`purpose-detail-${row}`) || null })),
    })
  }
  return <details><summary>Kê đơn cho phiên khám</summary><form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Đơn thuốc mới</legend>
      <label htmlFor={`${id}-date`}>Ngày kê đơn<input id={`${id}-date`} name="date" type="date" required /></label>
      <label htmlFor={`${id}-note`}>Ghi chú điều trị<textarea id={`${id}-note`} name="note" maxLength={8000} /></label>
      <p>Mỗi dòng chọn mã thuốc danh mục hoặc tên thuốc bổ sung. Nhập liều và hướng dẫn sử dụng trong “Liều dùng”; nhập thời gian dùng riêng.</p>
      {rows.map((row, index) => <fieldset key={row}><legend>Thuốc {index + 1}</legend>
        <label htmlFor={`${id}-drug-${row}`}>Mã thuốc danh mục<input id={`${id}-drug-${row}`} name={`drug-${row}`} maxLength={50} /></label>
        <label htmlFor={`${id}-name-${row}`}>Tên thuốc bổ sung (khi không chọn mã)<input id={`${id}-name-${row}`} name={`name-${row}`} maxLength={255} /></label>
        <label htmlFor={`${id}-dose-${row}`}>Liều dùng<input id={`${id}-dose-${row}`} name={`dose-${row}`} required maxLength={100} /></label>
        <label htmlFor={`${id}-duration-${row}`}>Thời gian dùng<input id={`${id}-duration-${row}`} name={`duration-${row}`} required maxLength={100} /></label>
        <button type="button" disabled={rows.length === 1} onClick={() => setRows((items) => items.filter((item) => item !== row))}>Bỏ dòng thuốc {index + 1}</button>
      </fieldset>)}
      <button type="button" disabled={rows.length >= 50} onClick={() => add(setRows)}>Thêm dòng thuốc</button>
      {stops.map((row, index) => <fieldset key={row}><legend>Chỉ dẫn ngừng thuốc {index + 1}</legend>
        <label htmlFor={`${id}-stop-drug-${row}`}>Thuốc cần ngừng<input id={`${id}-stop-drug-${row}`} name={`stop-drug-${row}`} required maxLength={255} /></label>
        <label htmlFor={`${id}-stop-date-${row}`}>Ngừng từ ngày<input id={`${id}-stop-date-${row}`} name={`stop-date-${row}`} type="date" /></label>
        <label htmlFor={`${id}-stop-days-${row}`}>Thời gian ngừng (ngày)<input id={`${id}-stop-days-${row}`} name={`stop-days-${row}`} type="number" min={0} max={2147483647} step={1} /></label>
        <label htmlFor={`${id}-purpose-${row}`}>Mục đích<select id={`${id}-purpose-${row}`} name={`purpose-${row}`}><option value="">Chưa ghi nhận</option>{['Test huyet thanh tu than', 'Test kich thich', 'Khac'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label htmlFor={`${id}-purpose-detail-${row}`}>Ghi rõ nếu mục đích khác<input id={`${id}-purpose-detail-${row}`} name={`purpose-detail-${row}`} maxLength={255} /></label>
        <button type="button" onClick={() => setStops((items) => items.filter((item) => item !== row))}>Bỏ chỉ dẫn {index + 1}</button>
      </fieldset>)}
      <button type="button" disabled={stops.length >= 50} onClick={() => add(setStops)}>Thêm chỉ dẫn ngừng thuốc</button>
      <button type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu đơn thuốc'}</button>
    </fieldset><MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
