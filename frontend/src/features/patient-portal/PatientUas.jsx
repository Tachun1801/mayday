import { useId, useState } from 'react'
import { useSession } from '../auth/context.js'
import { RemoteTable } from '../../shared/ui/DataView.jsx'
import { MutationStatus } from '../../shared/ui/MutationStatus.jsx'
import { useMutation } from '../../shared/use-mutation.js'
import { activeRecord, dailyPayload, ownRecord, todayInVietnam } from './portal.js'

export function PatientUasPage() {
  const [version, setVersion] = useState(0)
  return <PatientUas key={version} reload={() => setVersion((value) => value + 1)} />
}
function PatientUas({ reload }) {
  const { session } = useSession(), patientId = session.user.patient_id
  const [record, setRecord] = useState(null), [saved, setSaved] = useState(null)
  return <section><h1>Nhật ký UAS</h1><p>Ghi điểm hôm nay theo giờ Việt Nam. Mỗi ngày chỉ gửi một lần cho bệnh nhân; các giá trị cần được ghi theo hướng dẫn của cơ sở y tế.</p>
    {saved ? <div role="status"><h2>Đã lưu điểm ngày {saved.ngay_cham_diem}</h2><p>HSS: {saved.diem_san_phu_hss} · ISS: {saved.diem_ngua_iss} · UAS ngày đã lưu: {saved.diem_uas_ngay}</p></div> : record
      ? <DailyUasForm record={record} onSaved={setSaved} reload={reload} changeRecord={() => setRecord(null)} />
      : <><p>Chọn hồ sơ mề đay mạn đang theo dõi để ghi điểm. Nếu chưa có hồ sơ phù hợp, liên hệ cơ sở y tế.</p>
        <RemoteTable title="Chọn hồ sơ để ghi UAS" path={`/patients/${encodeURIComponent(patientId)}/medical-records`} idField="ma_ho_so" columns={[
          ['ma_ho_so', 'Hồ sơ'], ['loai_benh_an', 'CAP: cấp / MAN: mạn'], ['trang_thai', 'Trạng thái'],
        ]} renderDetails={(item) => ownRecord(item, patientId) && item.loai_benh_an === 'MAN' && activeRecord(item)
          ? <button type="button" onClick={() => setRecord(item)}>Chọn hồ sơ này để ghi UAS</button>
          : <p>Chỉ ghi điểm trên hồ sơ mề đay mạn còn đang theo dõi của bạn.</p>} /></>}
    <RemoteTable key={saved?.id || 'history'} title="Lịch sử điểm đã lưu" path={`/patients/${encodeURIComponent(patientId)}/uas`} idField="ma_nhat_ky_uas" columns={[
      ['ngay_cham_diem', 'Ngày'], ['diem_san_phu_hss', 'HSS · Sẩn phù'], ['diem_ngua_iss', 'ISS · Ngứa'], ['diem_uas_ngay', 'UAS ngày'], ['trang_thai_ngay', 'Trạng thái ngày'],
    ]} />
    <p>Nếu điểm hôm nay đã có trong lịch sử, không gửi lại. Sau lỗi kết nối, kiểm tra lịch sử trước khi tiếp tục. Hiện chưa hỗ trợ nhập bù hoặc sửa điểm đã lưu.</p>
  </section>
}
export function DailyUasForm({ record, onSaved, reload, changeRecord }) {
  const id = useId(), day = todayInVietnam()
  const mutation = useMutation('/uas/daily', 'POST', onSaved), [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      if (day !== todayInVietnam()) throw new Error('Ngày đã thay đổi. Vui lòng đọc lại dữ liệu trước khi ghi điểm.')
      const data = dailyPayload(record.ma_ho_so, day, String(form.get('hss')), String(form.get('iss')))
      setError(''); mutation.save(data)
    } catch (failure) { setError(failure.message) }
  }
  return <div><form className="intake-form" onSubmit={submit} aria-busy={mutation.pending}>
    <fieldset disabled={mutation.pending || mutation.requiresReadback}><legend>Điểm ngày {day} · hồ sơ {record.ma_ho_so}</legend>
      {[['hss', 'Điểm sẩn phù (HSS)'], ['iss', 'Điểm ngứa (ISS)']].map(([name, label]) => <label key={name} htmlFor={`${id}-${name}`}>{label}<select id={`${id}-${name}`} name={name} required defaultValue="">
        <option value="" disabled>Chọn điểm từ 0 đến 3</option>{[0, 1, 2, 3].map((score) => <option key={score} value={score}>{score}</option>)}
      </select></label>)}
      <button type="submit">Gửi điểm hôm nay</button>
    </fieldset>{error && <p role="alert" className="error">{error}</p>}<MutationStatus mutation={mutation} reload={reload} />
  </form><button className="secondary" type="button" onClick={changeRecord} disabled={mutation.pending || mutation.requiresReadback}>Chọn hồ sơ khác</button></div>
}
