import { useId, useState } from 'react'
import { useMutation } from '../../shared/use-mutation.js'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { ResourceState } from '../../shared/ui/DataView.jsx'
import { useResource } from '../../shared/use-resource.js'
import { useSession } from '../auth/context.js'

export function StaffCreateForm({ reload }) {
  const id = useId(), mutation = useMutation('/admin/staff', 'POST', reload)
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.save(Object.fromEntries(['username', 'password', 'full_name', 'phone', 'role_id'].map((name) => [name, String(form.get(name) || '')])))
  }
  return <details><summary>Tạo tài khoản nhân viên</summary><form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Nhân viên cùng chi nhánh</legend>
      <label htmlFor={`${id}-username`}>Tên đăng nhập<input id={`${id}-username`} name="username" required maxLength={100} autoComplete="off" /></label>
      <label htmlFor={`${id}-password`}>Mật khẩu ban đầu (12–72 byte)<input id={`${id}-password`} name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label>
      <label htmlFor={`${id}-name`}>Họ tên<input id={`${id}-name`} name="full_name" required maxLength={150} autoComplete="off" /></label>
      <label htmlFor={`${id}-phone`}>Số điện thoại<input id={`${id}-phone`} name="phone" required pattern="[0-9]{10}" maxLength={10} inputMode="numeric" /></label>
      <label htmlFor={`${id}-role`}>Mã vai trò<input id={`${id}-role`} name="role_id" required pattern="[1-9][0-9]*" inputMode="numeric" /></label>
      <p>Chi nhánh lấy từ người quản trị. Vai trò được cấp phải nằm trong tập quyền bạn hiện có.</p><button type="submit">Tạo nhân viên</button>
    </fieldset><MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
export function AccountEditor({ account, reload }) {
  const { session } = useSession()
  const id = useId(), mutation = useMutation(`/admin/accounts/${encodeURIComponent(account.account_id)}`, 'PATCH', reload)
  const self = account.account_id === session?.user.account_id
  const [error, setError] = useState('')
  if (!account.branch_id || account.branch_id !== session?.user.branch_id) return <p>Chỉ được cập nhật nhân viên cùng chi nhánh.</p>
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget), data = {}
    const name = String(form.get('full_name') || '').trim()
    if (name !== account.full_name) data.full_name = name
    if (form.get('gender') !== 'keep') data.gender = form.get('gender') || null
    if (!self) {
      if (form.get('role_id') !== account.role_id) data.role_id = form.get('role_id')
      if ((form.get('active') === 'true') !== account.is_active) data.is_active = form.get('active') === 'true'
    }
    if (!Object.keys(data).length) { setError('Chưa có thay đổi để lưu.'); return }
    setError(''); mutation.save(data)
  }
  return <form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Cập nhật nhân viên {account.account_id}</legend>
      <label htmlFor={`${id}-name`}>Họ tên<input id={`${id}-name`} name="full_name" required maxLength={150} defaultValue={account.full_name} /></label>
      <label htmlFor={`${id}-gender`}>Giới tính<select id={`${id}-gender`} name="gender" defaultValue="keep"><option value="keep">Giữ nguyên</option><option value="">Xóa thông tin giới tính</option><option value="Nam">Nam</option><option value="Nu">Nữ</option></select></label>
      {!self && <><label htmlFor={`${id}-role`}>Mã vai trò<input id={`${id}-role`} name="role_id" defaultValue={account.role_id} pattern="[1-9][0-9]*" required /></label>
        <label htmlFor={`${id}-active`}>Trạng thái<select id={`${id}-active`} name="active" defaultValue={String(account.is_active)}><option value="true">Hoạt động</option><option value="false">Khóa tài khoản</option></select></label></>}
      {self && <p>Không được tự đổi vai trò hoặc khóa tài khoản của chính mình.</p>}<button type="submit">Lưu thay đổi</button>
    </fieldset>{error && <p role="alert">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form>
}
export function RoleCreateForm({ reload }) {
  const id = useId(), mutation = useMutation('/admin/roles', 'POST', reload)
  function submit(event) { event.preventDefault(); const form = new FormData(event.currentTarget); mutation.save({ ten_vai_tro: form.get('name'), ten_hien_thi: form.get('label'), mo_ta_vai_tro: form.get('description') || null }) }
  return <details><summary>Tạo vai trò</summary><form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Vai trò mới chưa được cấp quyền</legend>
      <label htmlFor={`${id}-name`}>Tên vai trò<input id={`${id}-name`} name="name" required maxLength={50} /></label>
      <label htmlFor={`${id}-label`}>Tên hiển thị<input id={`${id}-label`} name="label" required maxLength={100} /></label>
      <label htmlFor={`${id}-description`}>Mô tả<textarea id={`${id}-description`} name="description" maxLength={8000} /></label><button type="submit">Tạo vai trò</button>
    </fieldset><MutationStatus mutation={mutation} reload={reload} />
  </form></details>
}
export function RolePermissionEditor({ roleId }) {
  const state = useResource(`/admin/roles/${encodeURIComponent(roleId)}/permissions`)
  const { session } = useSession()
  if (state.loading || state.error) return <ResourceState {...state} />
  if (!Array.isArray(state.data?.items)) return <p role="alert">Phản hồi quyền chưa hợp lệ.</p>
  return <PermissionForm roleId={roleId} items={state.data.items} reload={state.retry} ownRole={roleId === session?.user.role_id} />
}
function PermissionForm({ roleId, items, reload, ownRole }) {
  const id = useId(), mutation = useMutation(`/admin/roles/${encodeURIComponent(roleId)}/permissions`, 'PUT', reload)
  function submit(event) {
    event.preventDefault()
    const ids = String(new FormData(event.currentTarget).get('ids') || '').trim()
    mutation.save({ permission_ids: ids ? ids.split(/[\s,]+/) : [] })
  }
  return <><p>Quyền hiện có: {items.length ? items.map((item) => `${item.ma_quyen_han}: ${item.ten_quyen_han}`).join('; ') : 'Chưa có quyền'}</p>
    {ownRole ? <p>Không được sửa mapping của vai trò đang sử dụng.</p> : <form onSubmit={submit} className="intake-form" aria-busy={mutation.pending}>
      <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Thay toàn bộ tập quyền</legend>
        <label htmlFor={id}>Mã quyền, cách nhau bởi dấu phẩy<input id={id} name="ids" defaultValue={items.map((item) => item.ma_quyen_han).join(', ')} maxLength={20000} /></label>
        <p>Để trống sẽ gỡ toàn bộ quyền của vai trò này. Chỉ cấp quyền bạn có; không thay vai trò đang dùng hoặc vai trò ảnh hưởng tài khoản ngoài chi nhánh.</p><button type="submit">Lưu tập quyền</button>
      </fieldset><MutationStatus mutation={mutation} reload={reload} />
    </form>}
  </>
}
