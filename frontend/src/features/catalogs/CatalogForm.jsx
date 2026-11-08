import { useId, useState } from 'react'
import { useMutation } from '../../shared/use-mutation.js'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
const groups = ['Khang histamine H1 TH2', 'Sinh hoc/dich', 'Uc che mien dich', 'Corticosteroid toan than', 'Khac']
const definitions = {
  branches: [['ten_chi_nhanh', 'Tên chi nhánh', 150, true], ['dia_chi', 'Địa chỉ', 8000, true], ['so_dien_thoai', 'Điện thoại', 20], ['trang_thai', 'Trạng thái hoạt động', 'boolean', true]],
  departments: [['ten_khoa_phong', 'Tên khoa/phòng', 150, true], ['loai_khoa', 'Loại khoa', 50, true], ['mo_ta', 'Mô tả', 8000]],
  rooms: [['ten_phong_kham', 'Tên phòng khám', 150, true]],
  drugs: [['ten_thuoc', 'Tên thuốc', 255, true], ['hoat_chat', 'Hoạt chất', 255], ['nhom_dieu_tri', 'Nhóm điều trị', groups]],
  'wheal-characteristics': [['ten_dac_diem', 'Tên đặc điểm sẩn phù', 150, true], ['mo_ta', 'Mô tả', 8000]],
}
export function CatalogForm({ kind, initial, id: resourceId, reload }) {
  const id = useId(), creating = resourceId == null, [error, setError] = useState('')
  const root = ['branches', 'departments', 'rooms'].includes(kind) ? '/facilities' : '/catalogs'
  const mutation = useMutation(`${root}/${kind}${creating ? '' : `/${encodeURIComponent(resourceId)}`}`, creating ? 'POST' : 'PATCH', reload)
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget), data = {}
    for (const [key, , type] of definitions[kind]) {
      const raw = String(form.get(key) || ''), value = type === 'boolean' ? raw === 'true' : raw || null
      if (creating || value !== (initial?.[key] ?? null)) data[key] = value
    }
    if (creating && kind === 'drugs') data.ma_thuoc = form.get('ma_thuoc')
    if (!Object.keys(data).length) { setError('Chưa có thay đổi để lưu.'); return }
    setError(''); mutation.save(data)
  }
  return <details><summary>{creating ? 'Thêm bản ghi danh mục' : 'Cập nhật bản ghi'}</summary><form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>{creating ? 'Tạo mới' : `Cập nhật ${resourceId}`}</legend>
      {creating && kind === 'drugs' && <label htmlFor={`${id}-code`}>Mã thuốc<input id={`${id}-code`} name="ma_thuoc" required maxLength={50} /></label>}
      {definitions[kind].map(([key, label, type, required]) => <label key={key} htmlFor={`${id}-${key}`}>{label}
        {type === 'boolean' || Array.isArray(type)
          ? <select id={`${id}-${key}`} name={key} defaultValue={String(initial?.[key] ?? '')} required={required}>
            {type !== 'boolean' && <option value="">Chưa ghi nhận</option>}
            {(type === 'boolean' ? ['true', 'false'] : type).map((value) => <option key={value} value={value}>{type === 'boolean' ? value === 'true' ? 'Hoạt động' : 'Ngừng hoạt động' : value}</option>)}
          </select>
          : <input id={`${id}-${key}`} name={key} defaultValue={initial?.[key] || ''} required={required} maxLength={type} />}
      </label>)}<button type="submit">{creating ? 'Thêm mới' : 'Lưu thay đổi'}</button>
    </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
