import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { DetailView, RemoteTable } from '../../shared/ui/DataView.jsx'
import { LabResults, Prescriptions } from './ClinicalResults.jsx'
import { RecordWorkflow } from './RecordWorkflow.jsx'
import { ClinicalHistory } from './ClinicalHistory.jsx'
import { ContentEditor, VisitCreateForm } from './ClinicalEditor.jsx'
import { LesionHistory } from './LesionHistory.jsx'
import { editorFields } from './editor-fields.js'
import { FieldDetails } from '../../shared/ui/DataView.jsx'
import { MediaPanel } from '../media/MediaPanel.jsx'

const columns = [['ma_ho_so', 'Mã hồ sơ'], ['ma_benh_nhan', 'Mã bệnh nhân'], ['loai_benh_an', 'Loại bệnh án'], ['trang_thai', 'Trạng thái'], ['thoi_diem_kham_lan_dau', 'Khám lần đầu']]
export function RecordsPage() {
  return <section><h1>Hồ sơ bệnh án</h1><RemoteTable path="/medical-records" idField="ma_ho_so" detailBase="/medical-records" columns={columns} /></section>
}
export function RecordPage() {
  const { id } = useParams()
  return <RecordDetail key={id} id={id} />
}
function RecordDetail({ id }) {
  const [notice, setNotice] = useState('')
  const path = `/medical-records/${encodeURIComponent(id)}`
  return <section><Link to="/medical-records">← Danh sách hồ sơ</Link><h1>Chi tiết hồ sơ</h1>
    {notice && <p role="status">{notice}</p>}
    <DetailView path={path} fields={[...columns, ['chan_doan_ban_dau_phong_kham', 'Chẩn đoán ban đầu'], ['ngay_bat_dau_dieu_tri_ngoai_tru', 'Bắt đầu điều trị ngoại trú'], ['ngay_ket_thuc_dieu_tri_ngoai_tru', 'Kết thúc điều trị ngoại trú'], ['chi_tiet.chan_doan_chinh', 'Chẩn đoán chính đã ghi nhận (mạn)'], ['chi_tiet.nhap_vien', 'Nhập viện đã ghi nhận (cấp)']]}>
      {(record, reload) => <>
      <details><summary>Nội dung bệnh án đã lưu</summary><FieldDetails record={record} fields={Object.entries(editorFields.hosobenhan).map(([field, definition]) => [field, definition.label])} />
        <FieldDetails record={record.chi_tiet} fields={Object.entries(editorFields[record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman']).map(([field, definition]) => [field, definition.label])} />
      </details>
      <RecordWorkflow record={record} onChanged={(status) => {
        setNotice(status === 'completed' ? 'Đã hoàn tất hồ sơ.' : status === 'in_progress' ? 'Đã bắt đầu khám.' : '')
        reload()
      }} />
      {record.assigned_to_current_doctor && ['draft', 'in_progress'].includes(record.trang_thai) && <>
        <ContentEditor title="Nhập và sửa bệnh án" path={`${path}/content`} reload={reload} groups={[
          { key: 'record', table: 'hosobenhan', label: 'Thông tin chung', initial: record },
          { key: 'detail', table: record.loai_benh_an === 'CAP' ? 'benhanmaydaycap' : 'benhanmaydayman', label: 'Bệnh án cấp/mạn', initial: record.chi_tiet },
        ]} />
        <VisitCreateForm recordPath={path} reload={reload} />
      </>}
      <RemoteTable title="Phiên khám" path={`${path}/visits`} idField="ma_phien_kham" detailBase={`${path}/visits`} columns={[
        ['ma_phien_kham', 'Mã phiên'], ['ngay_kham', 'Ngày khám'], ['lan_kham_thu', 'Lần khám'], ['ma_bac_si', 'Mã bác sĩ'], ['ma_phong_kham', 'Mã phòng'], ['ngay_hen_tai_kham', 'Hẹn tái khám'],
      ]} />
      <ClinicalHistory recordPath={path} type={record.loai_benh_an} writable={record.assigned_to_current_doctor && ['draft', 'in_progress'].includes(record.trang_thai)} />
      <Prescriptions recordPath={path} />
      <LabResults recordPath={path} />
      <MediaPanel key={id} recordPath={path} writable={record.assigned_to_current_doctor && ['draft', 'in_progress'].includes(record.trang_thai)} />
      {record.loai_benh_an === 'MAN' && <LesionHistory recordPath={path} writable={record.assigned_to_current_doctor && ['draft', 'in_progress'].includes(record.trang_thai)} />}
      </>}
    </DetailView>
  </section>
}
