import { DataTable, FieldDetails, RemoteTable } from '../../shared/ui/DataView.jsx'
import { labFields, medicationColumns, prescriptionFields } from './clinical-details.js'

export function PrescriptionDetails({ item }) {
  return <div className="clinical-detail">
    <FieldDetails record={item} fields={prescriptionFields} />
    <h3>Thuốc trong đơn {item.ma_don_thuoc}</h3>
    {!Array.isArray(item.items) ? <p role="alert">Phản hồi thiếu danh sách thuốc của đơn.</p>
      : item.items.length === 0 ? <p>Đơn chưa có chi tiết thuốc.</p>
        : <DataTable items={item.items} columns={medicationColumns} idField="ma_chi_tiet_don_thuoc" title={`Thuốc trong đơn ${item.ma_don_thuoc}`} />}
    {Array.isArray(item.stop_instructions) && <><h3>Chỉ dẫn ngừng thuốc đã kê</h3><DataTable items={item.stop_instructions}
      idField="ma_chi_dan_ngung" title="Chỉ dẫn ngừng thuốc" columns={[
        ['thuoc_can_ngung', 'Thuốc cần ngừng'], ['ngung_tu_ngay', 'Ngừng từ ngày'], ['thoi_gian_ngung_ngay', 'Thời gian ngừng (ngày)'],
        ['muc_dich', 'Mục đích'], ['muc_dich_khac_ghi_ro', 'Mục đích khác'],
      ]} /></>}
  </div>
}

export function LabDetails({ item }) {
  const knownType = ['CAP', 'MAN'].includes(item.loai_ket_qua_can_lam_sang)
  return <div className="clinical-detail">
    <FieldDetails record={item} fields={labFields(item.loai_ket_qua_can_lam_sang)} />
    {!knownType && <p role="alert">Loại kết quả chưa được hỗ trợ để hiển thị chi tiết.</p>}
    {knownType && !item.chi_tiet && <p>Chưa có chi tiết kết quả {item.loai_ket_qua_can_lam_sang === 'CAP' ? 'cấp' : 'mạn'}.</p>}
  </div>
}

export function Prescriptions({ recordPath }) {
  return <RemoteTable title="Đơn thuốc" path={`${recordPath}/prescriptions`} idField="ma_don_thuoc" columns={[
    ['ma_don_thuoc', 'Mã đơn'], ['ma_phien_kham', 'Mã phiên'], ['ngay_ke_don', 'Ngày kê'], ['trang_thai_don', 'Trạng thái'],
  ]} renderDetails={(item) => <PrescriptionDetails item={item} />} />
}

export function LabResults({ recordPath }) {
  return <RemoteTable title="Kết quả cận lâm sàng" path={`${recordPath}/labs`} idField="ma_ket_qua_can_lam_sang" columns={[
    ['ma_ket_qua_can_lam_sang', 'Mã kết quả'], ['ma_phien_kham', 'Mã phiên'], ['loai_ket_qua_can_lam_sang', 'Loại'],
    ['wbc', 'WBC (G/L)'], ['crp', 'CRP (mg/L)'], ['ige_toan_phan', 'IgE toàn phần (IU/mL)'], ['thoi_diem_thuc_hien', 'Thời điểm thực hiện'],
  ]} renderDetails={(item) => <LabDetails item={item} />} />
}
