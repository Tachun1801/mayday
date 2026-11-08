import { useParams, Link, useNavigate } from 'react-router-dom'
import { DetailView, RemoteTable } from '../../shared/ui/DataView.jsx'
import { ContentEditor, VisitCreateForm } from '../medical-records/ClinicalEditor.jsx'
import { useSession } from '../auth/context.js'
import { useState } from 'react'

const columns = [['ma_benh_nhan', 'Mã bệnh nhân'], ['ho_ten', 'Họ tên'], ['so_dien_thoai', 'Số điện thoại'], ['ngay_sinh', 'Ngày sinh'], ['gioi_tinh', 'Giới tính']]
export function PatientsPage() {
  return <section><h1>Bệnh nhân</h1><p><Link to="/patients/new">Tiếp nhận bệnh nhân mới</Link> · <Link to="/patients/first-contact">Tiếp nhận tài khoản bệnh nhân lần đầu</Link></p><RemoteTable path="/patients" columns={columns} idField="ma_benh_nhan" detailBase="/patients" search /></section>
}
export function PatientPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useSession()
  const [version, setVersion] = useState(0)
  const patientPath = `/patients/${encodeURIComponent(id)}`
  return <section><Link to="/patients">← Danh sách bệnh nhân</Link><h1>Thông tin bệnh nhân</h1>
    <DetailView key={`${id}/${version}`} path={patientPath} fields={[...columns, ['ma_his', 'Mã HIS'], ['nghe_nghiep', 'Nghề nghiệp'], ['dan_toc', 'Dân tộc'], ['dia_chi_tinh_tp', 'Tỉnh/thành phố'], ['dia_chi_xa_phuong', 'Xã/phường']]}>
      {(patient, reload) => <>
      {session?.user.staff_id && <>
        <ContentEditor title="Cập nhật thông tin hành chính" path={patientPath} reload={reload} groups={[
          { key: 'person', table: 'nguoi', label: 'Thông tin cá nhân', initial: patient },
          { key: 'patient', table: 'benhnhan', label: 'Thông tin bệnh nhân', initial: patient },
        ]} />
        <VisitCreateForm patientPath={patientPath} reload={() => setVersion((value) => value + 1)} onCreated={(data) => navigate(`/medical-records/${encodeURIComponent(data.record_id)}`)} />
      </>}
      <RemoteTable path={`${patientPath}/medical-records`} title="Lịch sử hồ sơ bệnh án" idField="ma_ho_so" detailBase="/medical-records" columns={[
        ['ma_ho_so', 'Mã hồ sơ'], ['loai_benh_an', 'Loại bệnh án'], ['trang_thai', 'Trạng thái'], ['thoi_diem_kham_lan_dau', 'Khám lần đầu'],
      ]} />
      <RemoteTable path={`${patientPath}/uas`} title="Nhật ký UAS" idField="ma_nhat_ky_uas" columns={[
        ['ngay_cham_diem', 'Ngày'], ['diem_san_phu_hss', 'HSS · Sẩn phù'], ['diem_ngua_iss', 'ISS · Ngứa'], ['diem_uas_ngay', 'UAS ngày'], ['trang_thai_ngay', 'Trạng thái ngày'],
      ]} />
      </>}
    </DetailView>
  </section>
}
