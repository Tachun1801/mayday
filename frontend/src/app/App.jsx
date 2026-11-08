import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { SystemStatus } from '../features/system/SystemStatus.jsx'
import { isSessionActive, sessionHome } from '../features/auth/session.js'
import { SessionProvider } from '../features/auth/SessionProvider.jsx'
import { useSession } from '../features/auth/context.js'
import { LoginPage } from '../features/auth/LoginPage.jsx'
import { ProfilePage } from '../features/auth/ProfilePage.jsx'
import { NewIntakePage } from '../features/patients/NewIntakePage.jsx'
import { PatientPage, PatientsPage } from '../features/patients/PatientsPage.jsx'
import { FacilitiesPage } from '../features/facilities/FacilitiesPage.jsx'
import { RecordPage, RecordsPage } from '../features/medical-records/RecordsPage.jsx'
import { AdminPage } from '../features/admin/AdminPage.jsx'
import { DrugsPage } from '../features/catalogs/DrugsPage.jsx'
import { VisitPage } from '../features/medical-records/ClinicalHistory.jsx'
import { FirstContactPage } from '../features/patients/FirstContactPage.jsx'
import { SignupPage } from '../features/auth/SignupPage.jsx'
import { PatientHome, PatientRecordPage, PatientRecords, PatientWorkspace } from '../features/patient-portal/PatientPortal.jsx'
import { PatientUasPage } from '../features/patient-portal/PatientUas.jsx'

function Workspace() {
  const { session, signOut } = useSession()
  if (!isSessionActive(session)) return <Navigate to="/login" replace />
  if (!session.user.staff_id) return <Navigate to={sessionHome(session.user)} replace />
  return <div className="workspace"><aside><Link className="brand" to="/patients">DrMayDay</Link><p>{session.user.full_name}</p><nav aria-label="Điều hướng chính">
    <NavLink to="/patients">Bệnh nhân</NavLink><NavLink to="/medical-records">Hồ sơ bệnh án</NavLink><NavLink to="/facilities">Cơ sở y tế</NavLink><NavLink to="/drugs">Danh mục thuốc</NavLink><NavLink to="/profile">Tài khoản</NavLink><NavLink to="/admin">Quản trị</NavLink><NavLink to="/system">Trạng thái hệ thống</NavLink>
  </nav>{session.user.patient_id && <p><Link to="/portal">Chuyển sang khu vực bệnh nhân</Link></p>}<button className="secondary" type="button" onClick={signOut}>Thoát trên thiết bị này</button><small>Token phía server có thể còn hiệu lực tối đa 15 phút.</small></aside><main id="main-content"><Outlet /></main></div>
}

export default function App() {
  return <BrowserRouter><SessionProvider><a className="skip-link" href="#main-content">Đến nội dung chính</a><Routes>
    <Route path="/login" element={<main id="main-content" className="login"><LoginPage /></main>} />
    <Route path="/register" element={<main id="main-content" className="login"><SignupPage /></main>} />
    <Route path="/system" element={<main id="main-content" className="standalone"><Link to="/">← Trang chính</Link><SystemStatus /></main>} />
    <Route path="/portal" element={<PatientWorkspace />}>
      <Route index element={<PatientHome />} /><Route path="records" element={<PatientRecords />} /><Route path="records/:id" element={<PatientRecordPage />} />
      <Route path="uas" element={<PatientUasPage />} /><Route path="profile" element={<ProfilePage />} />
      <Route path="*" element={<section><h1>Không tìm thấy trang</h1><Link to="/portal">Về tổng quan</Link></section>} />
    </Route>
    <Route element={<Workspace />}>
      <Route index element={<Navigate to="/patients" replace />} />
      <Route path="/patients" element={<PatientsPage />} /><Route path="/patients/new" element={<NewIntakePage />} /><Route path="/patients/:id" element={<PatientPage />} />
      <Route path="/patients/first-contact" element={<FirstContactPage />} />
      <Route path="/medical-records" element={<RecordsPage />} /><Route path="/medical-records/:id" element={<RecordPage />} />
      <Route path="/medical-records/:id/visits/:visitId" element={<VisitPage />} />
      <Route path="/admin" element={<AdminPage />} /><Route path="/facilities" element={<FacilitiesPage />} /><Route path="/drugs" element={<DrugsPage />} /><Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<section><h1>Không tìm thấy trang</h1><Link to="/">Về trang chính</Link></section>} />
    </Route>
  </Routes></SessionProvider></BrowserRouter>
}
