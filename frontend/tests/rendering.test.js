import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

let ui
let temporary
before(async () => {
  // Use the installed Vite/React toolchain to render actual JSX under Node.
  // No browser, keyring, HTTP server, new test framework or remote API.
  const result = await build({ configFile: false, plugins: [react()], logLevel: 'silent',
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/') },
    ssr: { noExternal: true },
    build: { ssr: fileURLToPath(new URL('./render-fixture.js', import.meta.url)), write: false,
      rollupOptions: { output: { codeSplitting: false } } },
  })
  const chunk = result.output.find((item) => item.type === 'chunk' && item.isEntry)
  temporary = await mkdtemp(join(tmpdir(), 'mayday-render-'))
  const modulePath = join(temporary, 'fixture.mjs')
  await writeFile(modulePath, chunk.code)
  ui = await import(pathToFileURL(modulePath).href)
})
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }) })

function render(component, props, session = { token: 'synthetic-token', user: { staff_id: '7' } }) {
  const h = ui.createElement
  return ui.renderToStaticMarkup(h(ui.MemoryRouter, null,
    h(ui.SessionContext.Provider, { value: { session, signOut() {} } }, h(ui[component], props))))
}

test('allowlisted fields preserve false, zero, precision and escape text', () => {
  const html = render('FieldDetails', { record: { zero: 0, flag: false, nested: { value: '0.0000' }, text: '<script>synthetic</script>', private_field: 'MUST_NOT_RENDER' },
    fields: [['zero', 'Số'], ['flag', 'Cờ'], ['nested.value', 'Độ chính xác'], ['text', 'Văn bản'], ['missing', 'Thiếu']] })
  assert.match(html, /<dd>0<\/dd>/)
  assert.match(html, /Không/)
  assert.match(html, /0\.0000/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /MUST_NOT_RENDER|<script>/)
})

test('prescription detail renders medication rows and explicit missing/empty states', () => {
  const html = render('PrescriptionDetails', { item: { ma_don_thuoc: '9007199254740993', ngung_thuoc_lan_sau: false,
    items: [{ ma_chi_tiet_don_thuoc: '42', ma_thuoc: 'SYNTHETIC', lieu_dung: 'Liều tổng hợp', thoi_gian_dung: 'Thời gian tổng hợp' }] } })
  assert.match(html, /9007199254740993/)
  assert.match(html, /Liều tổng hợp/)
  assert.match(html, /Thời gian tổng hợp/)
  assert.match(html, /Không/)
  assert.match(html, /<th[^>]*scope="col"/)
  assert.match(render('PrescriptionDetails', { item: { items: [] } }), /Đơn chưa có chi tiết thuốc/)
  assert.match(render('PrescriptionDetails', { item: {} }), /role="alert"/)
})

test('lab details use exact subtype fields and stored units without recomputing scores', () => {
  const acute = render('LabDetails', { item: { loai_ket_qua_can_lam_sang: 'CAP', wbc: '0.0000', chi_tiet: { nlr: '1.234567', anti_tpo: 'MUST_NOT_RENDER' } } })
  assert.match(acute, /WBC \(G\/L\)/)
  assert.match(acute, /0\.0000/)
  assert.match(acute, /1\.234567/)
  assert.doesNotMatch(acute, /Anti-TPO|MUST_NOT_RENDER/)
  const chronic = render('LabDetails', { item: { loai_ket_qua_can_lam_sang: 'MAN', chi_tiet: { ige_khang_tpo_ket_qua: 'Am tinh', anti_tpo: '1.2345', ft4: '2.5000' } } })
  assert.match(chronic, /IgE kháng TPO \(định tính\)/)
  assert.match(chronic, /Anti-TPO \(IU\/mL, định lượng\)/)
  assert.match(chronic, /FT4 \(pmol\/L\)/)
  assert.match(chronic, /2\.5000/)
  assert.doesNotMatch(chronic, /LYM/)
  assert.match(render('LabDetails', { item: { loai_ket_qua_can_lam_sang: 'MAN' } }), /Chưa có chi tiết kết quả mạn/)
  assert.match(render('LabDetails', { item: { loai_ket_qua_can_lam_sang: 'UNKNOWN' } }), /Loại kết quả chưa được hỗ trợ/)
})

test('expanded rows use native keyboard-accessible details and empty/error tables are explicit', () => {
  const html = render('DataTable', { items: [{ id: '1', label: 'Tổng hợp' }], idField: 'id', columns: [['label', 'Nhãn']],
    renderDetails: () => ui.createElement('p', null, 'Nội dung chi tiết') })
  assert.match(html, /<details><summary>/)
  assert.match(html, /Nội dung chi tiết/)
  assert.match(render('DataTable', { items: [], columns: [] }), /Chưa có dữ liệu phù hợp/)
  assert.match(render('DataTable', { items: null, columns: [] }), /role="alert"/)
})

test('empty later pages retain an enabled previous button', () => {
  const html = render('Pagination', { page: 2, total: 0, onChange() {} })
  assert.match(html, /<button type="button">Trước<\/button>/)
  assert.match(html, /<button type="button" disabled="">Sau<\/button>/)
  assert.match(html, /aria-label="Phân trang danh sách"/)
})

test('loading and controlled errors have accessible status/alert markup', () => {
  assert.match(render('ResourceState', { loading: true }), /role="status"/)
  assert.match(render('ResourceState', { error: 'Không có quyền', retry() {} }), /role="alert"/)
  assert.match(render('RemoteTable', { path: '/synthetic', columns: [], idField: 'id' }), /Đang tải dữ liệu/)
})

test('workflow renders only forward actions for staff and a terminal completed state', () => {
  assert.match(render('RecordWorkflow', { record: { ma_ho_so: '1', trang_thai: 'draft' } }), /Bắt đầu khám/)
  assert.match(render('RecordWorkflow', { record: { ma_ho_so: '1', trang_thai: 'in_progress' } }), /Hoàn tất hồ sơ/)
  const completed = render('RecordWorkflow', { record: { ma_ho_so: '1', trang_thai: 'completed' } })
  assert.match(completed, /Hồ sơ đã hoàn tất/)
  assert.doesNotMatch(completed, /<button/)
  for (const status of ['pending', 'cancelled', 'unknown']) {
    assert.equal(render('RecordWorkflow', { record: { trang_thai: status } }), '')
  }
  assert.equal(render('RecordWorkflow', { record: { trang_thai: 'draft' } }, { user: { patient_id: '1' } }), '')
})

test('visit detail shows actual subtype notes, false/zero and omits other subtype or private fields', () => {
  const acute = render('VisitDetails', { visit: { loai_benh_an: 'CAP', dan_do: 'Synthetic advice', chi_tiet: { so_lan_non: 0, co_san_phu: false, chan_doan_tai_kham: 'MUST_NOT_RENDER' } } })
  assert.match(acute, /Synthetic advice/); assert.match(acute, /<dd>0<\/dd>/); assert.match(acute, /Không/); assert.doesNotMatch(acute, /MUST_NOT_RENDER/)
  const chronic = render('VisitDetails', { visit: { loai_benh_an: 'MAN', chi_tiet: { chan_doan_tai_kham: 'Synthetic chronic note' } } })
  assert.match(chronic, /Synthetic chronic note/); assert.doesNotMatch(chronic, /Số lần nôn/)
})
test('fixed forms label inputs, retain server precision and omit generated or assignment fields', () => {
  const html = render('FixedFields', { table: 'ketquacanlamsangcap', initial: { lym: '1.2345', nlr: 'MUST_NOT_RENDER' } })
  assert.match(html, /1\.2345/); assert.match(html, /<label[^>]+for=/); assert.doesNotMatch(html, /MUST_NOT_RENDER|name="nlr"|name="ma_bac_si"/)
  const editor = render('ContentEditor', { title: 'Synthetic editor', path: '/synthetic', groups: [{ key: 'visit', table: 'phienkham', label: 'Phiên khám', initial: {} }], reload() {} })
  assert.match(editor, /<details><summary>/); assert.match(editor, /<fieldset/); assert.match(editor, /name="visit.dan_do"/)
})
test('prescription/lab entry screens contain explicit required medication fields and read-only calculated output', () => {
  const prescription = render('PrescriptionEntry', { path: '/synthetic', reload() {} })
  assert.match(prescription, /<input(?=[^>]*name="dose-0")(?=[^>]*required)[^>]*>/); assert.match(prescription, /<input(?=[^>]*name="duration-0")(?=[^>]*required)[^>]*>/); assert.match(prescription, /Thêm chỉ dẫn ngừng thuốc/)
  const lab = render('LabEntry', { path: '/synthetic', type: 'CAP', reload() {} })
  assert.match(lab, /name="detail.lym"/); assert.doesNotMatch(lab, /name="detail.nlr"|name="detail.anti_tpo"/)
})
test('admin forms keep self-lockout and branch boundaries visible and password input private', () => {
  const session = { token: 'synthetic-token', user: { staff_id: '2', account_id: '1', branch_id: '9' } }
  const self = render('AccountEditor', { account: { account_id: '1', branch_id: '9', full_name: 'Synthetic' }, reload() {} }, session)
  assert.match(self, /Không được tự đổi vai trò/); assert.doesNotMatch(self, /name="role_id"|name="active"/)
  const other = render('AccountEditor', { account: { account_id: '4', branch_id: '10' }, reload() {} }, session)
  assert.match(other, /Chỉ được cập nhật nhân viên cùng chi nhánh/); assert.doesNotMatch(other, /<form/)
  assert.match(render('StaffCreateForm', { reload() {} }, session), /type="password"[^>]*.*name=|name="password"[^>]*type="password"/)
})

test('private image is fetched only by explicit action and never renders an external URL initially', () => {
  const html = render('PrivateImage', { path: '/medical-records/21/attachments/31/content' })
  assert.match(html, /Xem ảnh được cấp quyền/); assert.doesNotMatch(html, /<img|cloudinary|signature|api_key/)
  assert.match(render('MediaPanel', { recordPath: '/synthetic', writable: true }), /Đang tải dữ liệu/)
})
test('lesion forms use explicit same-record attachment identifiers, NRS bounds and no AI/URL input', () => {
  const html = render('LesionPhotoForm', { path: '/synthetic/photos', reload() {} })
  assert.match(html, /name="attachment"/); assert.match(html, /name="stage"/); assert.match(html, /value="start"/); assert.match(html, /max="10"/)
  assert.doesNotMatch(html, /name="url_anh"|name="local_auas"|name="ma_benh_nhan"/)
})

test('patient workspace offers only patient navigation and public signup has no role/owner fields', () => {
  const patient = { token: 'synthetic', expiresAt: Date.now() + 900000, user: { patient_id: '11', full_name: 'Synthetic patient' } }
  const html = render('PatientWorkspace', {}, patient)
  assert.match(html, /Điều hướng bệnh nhân|Hồ sơ của tôi|Nhật ký UAS/)
  assert.doesNotMatch(html, /href="\/admin|href="\/patients\/new|href="\/facilities/)
  const signup = render('SignupPage', {}, null)
  assert.match(signup, /name="confirm"/); assert.match(signup, /type="password"/)
  assert.doesNotMatch(signup, /name="role_id"|name="patient_id"|name="is_active"/)
  const dual = render('PatientWorkspace', {}, { ...patient, user: { ...patient.user, staff_id: '7' } })
  assert.match(dual, /Chuyển sang khu vực nhân viên/)
})

test('patient daily form has explicit unselected component scores and no date/owner/generated input', () => {
  const html = render('DailyUasForm', { record: { ma_ho_so: '21' }, onSaved() {}, reload() {}, changeRecord() {} }, { token: 'synthetic', user: { patient_id: '11' } })
  assert.match(html, /name="hss"/); assert.match(html, /name="iss"/); assert.match(html, /Chọn điểm từ 0 đến 3/)
  assert.doesNotMatch(html, /name="patient_id"|name="diem_uas_ngay"|type="date"|name="doctor"/)
})

test('patient completed record excludes clinical editors and all lesion/media writes', () => {
  const html = render('PatientRecordContent', { record: { ma_ho_so: '21', ma_benh_nhan: '11', loai_benh_an: 'MAN', trang_thai: 'completed' }, recordPath: '/medical-records/21' }, { token: 'synthetic', user: { patient_id: '11' } })
  assert.match(html, /Hồ sơ chỉ được xem/)
  assert.doesNotMatch(html, /name="images"|Ghi nhận đợt tổn thương mới|Bắt đầu khám|Hoàn tất hồ sơ|Kê đơn cho phiên khám/)
  const photo = render('PatientPhotoForm', { path: '/synthetic/photos', recordPath: '/synthetic', locationPath: '/synthetic/locations', reload() {} }, { token: 'synthetic', user: { patient_id: '11' } })
  assert.match(photo, /select[^>]*name="attachment"/); assert.match(photo, /select[^>]*name="location"/)
  assert.doesNotMatch(photo, /input[^>]*name="attachment"|input[^>]*name="location"|name="url_anh"|name="ma_benh_nhan"/)
})
