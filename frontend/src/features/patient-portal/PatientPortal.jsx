import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { useSession } from '../auth/context.js'
import { isSessionActive, sessionHome } from '../auth/session.js'
import { useResource } from '../../shared/use-resource.js'
import { FieldDetails, RemoteTable, ResourceState } from '../../shared/ui/DataView.jsx'
import { Prescriptions, LabResults } from '../medical-records/ClinicalResults.jsx'
import { MediaPanel } from '../media/MediaPanel.jsx'
import { PatientLesions } from './PatientLesions.jsx'
import { activeRecord, ownRecord, recordStatus } from './portal.js'

export function PatientWorkspace() {
  const { session, signOut } = useSession()
  if (!isSessionActive(session)) return <Navigate to="/login" replace />
  if (!session.user.patient_id) return <Navigate to={sessionHome(session.user)} replace />
  return <div className="workspace patient-workspace"><aside>
    <Link className="brand" to="/portal">DrMayDay</Link><p className="eyebrow">Góc sức khỏe của bạn</p><p>{session.user.full_name}</p>
    <nav aria-label="Điều hướng bệnh nhân"><NavLink to="/portal" end>Tổng quan</NavLink><NavLink to="/portal/records">Hồ sơ của tôi</NavLink><NavLink to="/portal/uas">Nhật ký UAS</NavLink><NavLink to="/portal/profile">Tài khoản của tôi</NavLink></nav>
    {session.user.staff_id && <p><Link to="/patients">Chuyển sang khu vực nhân viên</Link></p>}
    <button type="button" className="secondary" onClick={signOut}>Thoát trên thiết bị này</button><small>Phiên chỉ giữ trong bộ nhớ. Token server có thể còn hiệu lực tối đa 15 phút.</small>
  </aside><main id="main-content"><Outlet /></main></div>
}

export function PatientHome() {
  const { session } = useSession()
  return <section className="patient-home"><p className="eyebrow">DrMayDay · Chăm sóc cùng bạn</p><h1>Xin chào, {session.user.full_name}</h1>
    <p>Theo dõi hồ sơ và ghi nhận triệu chứng để chuẩn bị cho lần trao đổi tiếp theo với bác sĩ.</p>
    <div className="portal-cards">
      <Link to="/portal/records"><h2>Hồ sơ của tôi</h2><p>Xem các lần khám, lời dặn, đơn thuốc, kết quả và ảnh đã lưu.</p><span>Mở hồ sơ →</span></Link>
      <Link to="/portal/uas"><h2>Nhật ký UAS hôm nay</h2><p>Ghi điểm sẩn phù và ngứa khi bạn có hồ sơ mề đay mạn đang theo dõi.</p><span>Mở nhật ký →</span></Link>
      <Link to="/portal/profile"><h2>Thông tin cá nhân</h2><p>Cập nhật thông tin liên hệ và đổi mật khẩu tài khoản của bạn.</p><span>Mở tài khoản →</span></Link>
    </div>
    <p>Nếu chưa có hồ sơ, hãy liên hệ cơ sở y tế và cung cấp tên đăng nhập cùng số điện thoại để được tiếp nhận. Nếu nội dung báo thiếu quyền truy cập, cơ sở y tế cần kiểm tra quyền tài khoản của bạn.</p>
  </section>
}

export function PatientRecords() {
  const { session } = useSession()
  return <section><h1>Hồ sơ của tôi</h1><p>Chỉ hiển thị hồ sơ thuộc tài khoản bệnh nhân của bạn. Thông tin khám và đơn thuốc do cơ sở y tế ghi nhận.</p>
    <RemoteTable path={`/patients/${encodeURIComponent(session.user.patient_id)}/medical-records`} idField="ma_ho_so" detailBase="/portal/records" title="Danh sách hồ sơ" columns={[
      ['ma_ho_so', 'Mã hồ sơ'], ['loai_benh_an', 'Loại CAP: cấp / MAN: mạn'], ['trang_thai', 'Trạng thái'], ['thoi_diem_kham_lan_dau', 'Khám lần đầu'],
    ]} />
  </section>
}

export function PatientRecordPage() {
  const { id } = useParams()
  return <section><Link to="/portal/records">← Hồ sơ của tôi</Link><h1>Chi tiết hồ sơ</h1>
    {/^[1-9]\d{0,18}$/.test(id) ? <PatientRecord key={id} id={id} /> : <p role="alert">Không tìm thấy hồ sơ yêu cầu.</p>}
  </section>
}
function PatientRecord({ id }) {
  const { session } = useSession(), recordPath = `/medical-records/${encodeURIComponent(id)}`
  const state = useResource(recordPath)
  if (state.loading || state.error) return <ResourceState {...state} />
  // Also prevents a dual staff/patient identity from accidentally rendering
  // assigned staff records in the patient's personal workspace.
  if (!ownRecord(state.data, session.user.patient_id)) return <p role="alert">Không tìm thấy hồ sơ của bạn.</p>
  return <PatientRecordContent record={state.data} recordPath={recordPath} />
}
export function PatientRecordContent({ record, recordPath }) {
  const writable = activeRecord(record)
  return <>
    <p role="status">{recordStatus(record.trang_thai)}{record.trang_thai === 'completed' ? '. Hồ sơ chỉ được xem.' : ''}</p>
    <FieldDetails record={record} fields={[
      ['ma_ho_so', 'Mã hồ sơ'], ['loai_benh_an', 'Loại CAP: cấp / MAN: mạn'], ['thoi_diem_kham_lan_dau', 'Khám lần đầu'],
      ['ngay_bat_dau_dieu_tri_ngoai_tru', 'Bắt đầu điều trị ngoại trú'], ['ngay_ket_thuc_dieu_tri_ngoai_tru', 'Kết thúc điều trị ngoại trú'],
    ]} />
    <RemoteTable title="Các lần khám và lời dặn" path={`${recordPath}/visits`} idField="ma_phien_kham" columns={[
      ['lan_kham_thu', 'Lần khám'], ['ngay_kham', 'Ngày khám'], ['ngay_hen_tai_kham', 'Ngày hẹn tái khám'],
    ]} renderDetails={(visit) => <FieldDetails record={visit} fields={[
      ['tom_tat_buoi_kham', 'Tóm tắt buổi khám'], ['dan_do', 'Lời dặn của bác sĩ'], ['huong_xu_tri_lan_sau', 'Hướng xử trí lần sau đã ghi nhận'],
    ]} />} />
    <Prescriptions recordPath={recordPath} /><LabResults recordPath={recordPath} />
    <MediaPanel key={recordPath} recordPath={recordPath} writable={writable} />
    {record.loai_benh_an === 'MAN' && <PatientLesions recordPath={recordPath} writable={writable} />}
  </>
}
