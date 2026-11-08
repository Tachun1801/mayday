import { useParams, Link } from 'react-router-dom'
import { DetailView, FieldDetails, RemoteTable } from '../../shared/ui/DataView.jsx'
import { acuteVisitFields, chronicVisitFields, recordSections, visitFields } from './clinical-fields.js'
import { ContentEditor, HistoryEditor } from './ClinicalEditor.jsx'
import { LabEntry, ObservationEntry, PrescriptionEntry } from './VisitEntry.jsx'
import { LabResults, Prescriptions } from './ClinicalResults.jsx'
import { useSession } from '../auth/context.js'

export function VisitDetails({ visit }) {
  const fields = visit.loai_benh_an === 'CAP' ? acuteVisitFields : visit.loai_benh_an === 'MAN' ? chronicVisitFields : []
  return <>
    <FieldDetails record={visit} fields={visitFields} />
    {fields.length === 0 ? <p role="alert">Loại phiên khám chưa được hỗ trợ.</p>
      : !visit.chi_tiet ? <p>Chưa có nội dung chi tiết của phiên khám.</p>
        : <FieldDetails record={visit.chi_tiet} fields={fields} />}
  </>
}
export function VisitPage() {
  const { id, visitId } = useParams()
  const { session } = useSession()
  const recordPath = `/medical-records/${encodeURIComponent(id)}`
  const path = `${recordPath}/visits/${encodeURIComponent(visitId)}`
  return <section><Link to={recordPath}>← Hồ sơ bệnh án</Link><h1>Chi tiết phiên khám</h1>
    <DetailView key={id} path={recordPath} fields={[]}>
      {(record) => <DetailView key={`${id}/${visitId}`} path={path} fields={[]}>
        {(visit, reload) => <>
          <VisitDetails visit={visit} />
          {record.assigned_to_current_doctor && String(visit.ma_bac_si) === String(session?.user.staff_id) && ['draft', 'in_progress'].includes(record.trang_thai) && <>
            <ContentEditor title="Nhập và sửa nội dung khám" path={path} reload={reload} groups={[
              { key: 'visit', table: 'phienkham', label: 'Thông tin phiên khám', initial: visit },
              { key: 'detail', table: visit.loai_benh_an === 'CAP' ? 'phienkhamcap' : 'phienkhamman', label: 'Nội dung khám cấp/mạn', initial: visit.chi_tiet },
            ]} />
            <ObservationEntry path={path} type={visit.loai_benh_an} reload={reload} />
            <PrescriptionEntry path={path} reload={reload} />
            <LabEntry path={path} type={visit.loai_benh_an} reload={reload} />
          </>}
          {record.trang_thai === 'completed' && <p role="status">Hồ sơ đã hoàn tất. Nội dung chỉ được xem.</p>}
          <Prescriptions recordPath={recordPath} /><LabResults recordPath={recordPath} />
        </>}
      </DetailView>}
    </DetailView>
  </section>
}
export function ClinicalHistory({ recordPath, type, writable = false }) {
  return <section aria-label="Dữ liệu lâm sàng đã ghi nhận"><h2>Tiền sử và thông tin khám đã lưu</h2>
    {recordSections.filter((section) => !section.type || section.type === type).map((section) =>
      <details key={section.path}><summary>{section.title}</summary>
        <RemoteTable path={`${recordPath}/clinical/${section.path}`} title={section.title} idField={section.id}
          columns={[[section.id, 'Mã bản ghi'], ...section.fields.slice(0, 2)]}
          renderDetails={(item) => <FieldDetails record={item} fields={section.fields} />} />
        {writable && ['personal-history', 'previous-episodes', 'allergy-context', 'infections'].includes(section.path) && <HistoryEditor path={`${recordPath}/clinical/${section.path}`} section={section} />}
      </details>)}
  </section>
}
