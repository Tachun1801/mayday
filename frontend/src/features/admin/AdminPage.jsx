import { RemoteTable } from '../../shared/ui/DataView.jsx'
import { useState } from 'react'
import { AccountEditor, RoleCreateForm, RolePermissionEditor, StaffCreateForm } from './AdminForms.jsx'

export function AdminPage() {
  const [version, setVersion] = useState(0)
  const reload = () => setVersion((value) => value + 1)
  return <AdminContent key={version} reload={reload} />
}
function AdminContent({ reload }) {
  return <section><h1>Quản trị tài khoản và quyền</h1>
    <StaffCreateForm reload={reload} /><RoleCreateForm reload={reload} />
    <RemoteTable title="Tài khoản" path="/admin/accounts" idField="account_id" columns={[
      ['account_id', 'Mã tài khoản'], ['username', 'Tên đăng nhập'], ['full_name', 'Họ tên'], ['role_id', 'Mã vai trò'], ['is_active', 'Hoạt động'], ['branch_id', 'Mã chi nhánh'],
    ]} renderDetails={(account) => <AccountEditor account={account} reload={reload} />} />
    <RemoteTable title="Vai trò" path="/admin/roles" idField="ma_vai_tro" columns={[
      ['ma_vai_tro', 'Mã vai trò'], ['ten_vai_tro', 'Tên vai trò'], ['ten_hien_thi', 'Tên hiển thị'],
    ]} renderDetails={(role) => <RolePermissionEditor roleId={role.ma_vai_tro} />} />
    <RemoteTable title="Quyền" path="/admin/permissions" idField="ma_quyen_han" columns={[
      ['ma_quyen_han', 'Mã quyền'], ['ten_quyen_han', 'Tên quyền'], ['nhom_quyen', 'Nhóm'],
    ]} />
  </section>
}
