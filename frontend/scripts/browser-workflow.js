// Opt-in browser acceptance against a stateful synthetic API only.
import assert from 'node:assert/strict'
import { createServer as httpServer } from 'node:http'
import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const list = (items) => ({ items, total: items.length, page: 1, limit: 20 })
const patientMode = process.argv[2] === 'PATIENT'
const caseType = patientMode || process.argv[2] === 'MAN' ? 'MAN' : 'CAP'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jLzQAAAAASUVORK5CYII=', 'base64')
const state = { attachments: [], id: '21', visitId: '55', status: 'draft', advice: '', intakes: 0, firstLookups: 0, firstIntakes: 0, updates: 0, prescriptions: [], labs: [], expire: false,
  signups: 0, daily: [], dailyAttempts: 0, episodes: [], locations: [], photos: [], denyRead: false, staffCalls: 0 }
const person = { ma_benh_nhan: '11', ho_ten: 'Synthetic browser patient', so_dien_thoai: '0000000000' }
const principal = patientMode
  ? { account_id: '8', person_id: '11', patient_id: '11', staff_id: null, branch_id: null, role_id: '4', username: 'synthetic-patient', full_name: 'Synthetic browser patient', phone: '0000000000', birth_date: null, gender: null, permissions: ['manage_medical_records'] }
  : { account_id: '1', person_id: '7', staff_id: '7', branch_id: '9', role_id: '3', full_name: 'Synthetic browser staff', permissions: ['manage_medical_records'] }
if (patientMode) {
  state.advice = 'Synthetic doctor advice'
  state.prescriptions = [{ ma_don_thuoc: '77', items: [{ ma_chi_tiet_don_thuoc: '78', ten_thuoc: 'Synthetic prescribed medicine', lieu_dung: 'Synthetic dose', thoi_gian_dung: 'Synthetic duration' }], stop_instructions: [] }]
  state.labs = [{ ma_ket_qua_can_lam_sang: '88', loai_ket_qua_can_lam_sang: 'MAN', wbc: '0.0000', chi_tiet: { anti_tpo: '1.2345' } }]
}
const record = () => ({ ma_ho_so: state.id, ma_benh_nhan: '11', loai_benh_an: caseType, trang_thai: state.status, assigned_to_current_doctor: true, chi_tiet: {} })
const visit = () => ({ ma_phien_kham: state.visitId, ma_ho_so: state.id, ma_bac_si: '7', loai_benh_an: caseType, ngay_kham: '2026-11-07', lan_kham_thu: 1, dan_do: state.advice, chi_tiet: {} })
let stage = 'setup'
const api = httpServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'), path = url.pathname.replace(/^\/api\/v1/, '')
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = req.headers['content-type']?.startsWith('image/') ? Buffer.concat(chunks) : chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
    function respond(data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ code: status < 400 ? '1000' : '9901', message: status < 400 ? 'OK' : 'Synthetic controlled error', data })) }
    if (path === '/auth/signup') {
      assert.deepEqual(Object.keys(body).sort(), ['birth_date', 'full_name', 'gender', 'password', 'phone', 'username'])
      state.signups++; await delay(80)
      if (body.username === 'synthetic-malformed') return respond({ account_id: '', patient_id: '' }, 201)
      return body.username === 'synthetic-uncertain' ? respond(null, 500) : respond({ account_id: '8', patient_id: '11' }, 201)
    }
    if (path === '/auth/login') return respond({ token: 'synthetic-browser-token', user_info: principal, expires_in: 900 })
    if (state.expire || req.headers.authorization !== 'Bearer synthetic-browser-token') return respond(null, 401)
    if (patientMode) {
      if (path === '/auth/me') {
        if (req.method === 'PUT') { assert.deepEqual(Object.keys(body).sort(), ['birth_date', 'full_name', 'gender', 'phone']); Object.assign(principal, body) }
        return respond({ user_info: principal })
      }
      if (path.startsWith('/admin') || path.startsWith('/facilities') || path === '/intakes') { state.staffCalls++; return respond(null, 403) }
      if (state.denyRead) return respond(null, 403)
      if (req.method === 'GET' && path.startsWith('/medical-records/') && !path.startsWith(`/medical-records/${state.id}`)) return respond(null, 404)
      if (path === '/patients/11/uas' && req.method === 'GET') return respond(list(state.daily))
      if (path === '/uas/daily' && req.method === 'POST') {
        state.dailyAttempts++
        assert.deepEqual(Object.keys(body).sort(), ['diem_ngua_iss', 'diem_san_phu_hss', 'ma_ho_so_man', 'ngay_cham_diem'])
        assert.equal(body.ma_ho_so_man, state.id); assert.equal(body.diem_san_phu_hss, 0); assert.equal(body.diem_ngua_iss, 3)
        if (state.daily.length) return respond(null, 409)
        const row = { id: '91', ma_nhat_ky_uas: '91', ...body, diem_uas_ngay: 3 }
        state.daily.push(row); await delay(80); return respond(row, 201)
      }
      if (path === `/medical-records/${state.id}/lesions`) {
        if (req.method === 'GET') return respond(list(state.episodes))
        assert.deepEqual(Object.keys(body).sort(), ['chi_tiet_dot_ton_thuong', 'ten_dot_ton_thuong_da'])
        state.episodes.push({ ma_dot_ton_thuong_da: '41', ...body }); await delay(80); return respond({ id: '41' }, 201)
      }
      if (path.endsWith('/lesions/41/locations')) {
        if (req.method === 'GET') return respond(list(state.locations))
        assert.deepEqual(Object.keys(body), ['vi_tri_co_the'])
        state.locations.push({ ma_vi_tri_ton_thuong: '51', ...body }); return respond({ id: '51' }, 201)
      }
      if (path.endsWith('/lesions/41/photos')) {
        if (req.method === 'GET') return respond(list(state.photos))
        assert.deepEqual(Object.keys(body).sort(), ['ma_tep_dinh_kem', 'ma_vi_tri_ton_thuong', 'moc_tien_trien', 'thoi_diem_chup'])
        assert.equal(body.ma_tep_dinh_kem, '31'); assert.equal(body.ma_vi_tri_ton_thuong, '51'); assert.equal(body.moc_tien_trien, 'start')
        state.photos.push({ ma_anh: '61', ...body }); await delay(80); return respond({ id: '61' }, 201)
      }
      if (path.endsWith('/lesions/41/photos/61') && req.method === 'PATCH') { Object.assign(state.photos[0], body); return respond({ id: '61' }) }
    }
    if (req.method === 'POST' && path === '/patients/first-contact/lookup') {
      state.firstLookups++
      assert.deepEqual(Object.keys(body).sort(), ['phone', 'username'])
      if (body.username === 'synthetic-denied') return respond(null, 403)
      if (body.username !== 'synthetic-first-contact' || body.phone !== '0000000000' || state.firstIntakes) return respond(null, 404)
      await delay(80)
      return respond({ patient_id: '11', full_name: person.ho_ten, birth_date: null, gender: null })
    }
    if (req.method === 'POST' && path === '/patients/11/first-contact') {
      assert.deepEqual(Object.keys(body).sort(), ['phone', 'record', 'username', 'visit'])
      assert.equal(body.username, 'synthetic-first-contact'); assert.equal(body.phone, '0000000000')
      assert.equal(body.record.loai_benh_an, caseType)
      if (state.firstIntakes) return respond(null, 409)
      state.firstIntakes++; state.id = '20'; state.visitId = '54'; state.status = 'draft'
      await delay(80)
      return respond({ patient_id: '11', record_id: state.id, visit_id: state.visitId, status: state.status }, 201)
    }
    if (req.method === 'GET') {
      if (path === '/patients') return respond(list([person]))
      if (path === '/patients/11') return respond(person)
      if (path === '/patients/11/medical-records' || path === '/medical-records') return respond(list([record()]))
      if (path === `/medical-records/${state.id}`) return respond(record())
      if (path === `/medical-records/${state.id}/visits`) return respond(list([visit()]))
      if (path === `/medical-records/${state.id}/visits/${state.visitId}`) return respond(visit())
      if (path.endsWith('/attachments')) return respond(list(state.attachments))
      if (path.endsWith('/attachments/31/content')) { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' }); res.end(PNG); return }
      if (path.endsWith('/prescriptions')) return respond(list(state.prescriptions))
      if (path.endsWith('/labs')) return respond(list(state.labs))
      return respond(list([]))
    }
    if (req.method === 'POST' && path === '/patients/11/intakes') {
      state.intakes++
      assert.deepEqual(Object.keys(body).sort(), ['record', 'visit'])
      assert.equal(body.record.loai_benh_an, caseType)
      state.id = '22'; state.visitId = '66'; state.status = 'draft'
      await delay(80)
      return respond({ patient_id: '11', record_id: state.id, visit_id: state.visitId, status: state.status }, 201)
    }
    if (req.method === 'POST' && path.endsWith('/attachments')) {
      assert.deepEqual(body, PNG)
      state.attachments.push({ id: '31', ten_tep_goc: 'synthetic.png', dinh_dang_tep: 'png', dung_luong_byte: String(PNG.length) })
      await delay(80)
      return respond({ id: '31', record_id: state.id }, 201)
    }
    if (req.method === 'PATCH' && path.endsWith('/status')) {
      assert.equal(body.status, state.status === 'draft' ? 'in_progress' : 'completed')
      state.status = body.status
      return respond({ id: state.id, status: state.status })
    }
    if (req.method === 'PATCH' && path.endsWith(`/visits/${state.visitId}`)) {
      state.updates++
      state.advice = body.visit.dan_do
      // Simulate an ambiguous mutation outcome: persistence happened, but the
      // first response is a controlled failure. The UI must force readback.
      return state.updates === 1 ? respond(null, 500) : respond({ id: state.visitId, record_id: state.id })
    }
    if (req.method === 'POST' && path.endsWith('/prescriptions')) {
      assert.equal(body.items.length, 1)
      assert.equal(body.items[0].ten_thuoc_bo_sung, 'Synthetic medication')
      state.prescriptions.push({ ma_don_thuoc: '77', ma_phien_kham: state.visitId, ngay_ke_don: body.ngay_ke_don, items: [{ ma_chi_tiet_don_thuoc: '78', ...body.items[0] }], stop_instructions: [] })
      await delay(80)
      return respond({ prescription_id: '77', record_id: state.id }, 201)
    }
    if (req.method === 'POST' && path.endsWith('/labs')) {
      assert.equal(body.result.wbc, '0.0000'); assert.equal(body.detail[caseType === 'CAP' ? 'lym' : 'anti_tpo'], '1.2345')
      state.labs.push({ ma_ket_qua_can_lam_sang: '88', ma_phien_kham: state.visitId, loai_ket_qua_can_lam_sang: caseType, ...body.result, chi_tiet: body.detail })
      return respond({ result_id: '88', record_id: state.id }, 201)
    }
    respond(null, 404)
  } catch {
    // Never print request bodies. These fixtures contain no real records.
    res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: '9901', data: null }))
  }
})

class DevTools {
  sequence = 0
  pending = new Map()
  constructor(socket) {
    this.socket = socket
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      const request = this.pending.get(message.id)
      if (!request) return
      clearTimeout(request.timer); this.pending.delete(message.id)
      if (message.error) request.reject(new Error(`Browser protocol: ${message.error.message}`))
      else request.resolve(message.result)
    })
  }
  call(method, params = {}) {
    const id = ++this.sequence
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Browser command timeout: ${method}`)) }, 10000)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }
  async evaluate(expression) {
    const response = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (response.exceptionDetails) throw new Error('Browser evaluation failed')
    return response.result?.value
  }
  async wait(expression) {
    const deadline = Date.now() + 15000
    while (Date.now() < deadline) { if (await this.evaluate(`Boolean(${expression})`)) return; await delay(40) }
    throw new Error('Browser condition timed out')
  }
  async fill(selector, value) {
    assert.equal(await this.evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)return false; el.value=${JSON.stringify(value)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`), true)
  }
  async clickText(selector, text) {
    assert.equal(await this.evaluate(`(() => { const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(text)}); if(!el)return false; el.click(); return true; })()`), true)
  }
  async submitIn(summary, twice = false) {
    const expression = `(() => { const el=[...document.querySelectorAll('details > summary')].find(x=>x.textContent.trim()===${JSON.stringify(summary)}); if(!el)return false; el.parentElement.open=true; const f=el.parentElement.querySelector('form'); if(!f)return false; f.requestSubmit(); ${twice ? 'f.requestSubmit();' : ''} return true; })()`
    assert.equal(await this.evaluate(expression), true)
  }
  async fillIn(summary, selector, value) {
    assert.equal(await this.evaluate(`(() => { const s=[...document.querySelectorAll('summary')].find(x=>x.textContent.trim()===${JSON.stringify(summary)}); const el=s?.parentElement.querySelector(${JSON.stringify(selector)}); if(!el)return false; el.value=${JSON.stringify(value)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`), true)
  }
}
async function patientWorkflow(browser, origin, temporary) {
  const spa = async (path) => browser.evaluate(`history.pushState({},'',${JSON.stringify(path)}); dispatchEvent(new PopStateEvent('popstate'))`)
  stage = 'patient signup and duplicate submit'
  await browser.call('Page.navigate', { url: `${origin}/register` })
  await browser.wait("document.querySelector('#signup-name')")
  await browser.fill('#signup-name', 'Synthetic browser patient'); await browser.fill('#signup-phone', '0000000000')
  await browser.fill('#signup-username', 'synthetic-patient'); await browser.fill('#signup-password', 'synthetic-patient-password'); await browser.fill('#signup-confirm', 'different-password')
  await browser.evaluate("document.querySelector('form').requestSubmit()")
  await browser.wait("document.querySelector('[role=alert]')")
  assert.equal(state.signups, 0)
  await browser.fill('#signup-confirm', 'synthetic-patient-password')
  await browser.evaluate("(() => { const f=document.querySelector('form'); f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("document.body.textContent.includes('Đã tạo tài khoản')")
  assert.equal(state.signups, 1)
  await browser.clickText('a', 'Đăng nhập')
  await browser.wait("document.querySelector('#username')")
  await browser.fill('#username', 'synthetic-patient'); await browser.fill('#password', 'synthetic-patient-password')
  await browser.evaluate("document.querySelector('form').requestSubmit()")
  await browser.wait("location.pathname==='/portal' && document.body.textContent.includes('Góc sức khỏe của bạn')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('a[href=\"/admin\"],a[href=\"/patients/new\"]'))"), false)
  stage = 'patient workspace guards and read permission error'
  await spa('/admin')
  await browser.wait("location.pathname==='/portal'")
  assert.equal(state.staffCalls, 0)
  state.denyRead = true
  await browser.clickText('a', 'Hồ sơ của tôi')
  await browser.wait("document.querySelector('[role=alert]') && document.body.textContent.includes('không có quyền')")
  state.denyRead = false
  await browser.clickText('button', 'Thử lại')
  await browser.wait("document.querySelector('a[href=\"/portal/records/21\"]')")
  stage = 'patient owned record, prescriptions, labs and guessed ID'
  await spa('/portal/records/999')
  await browser.wait("document.querySelector('[role=alert]')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('input[name=images]'))"), false)
  await spa('/portal/records/21')
  await browser.wait("document.body.textContent.includes('Synthetic doctor advice') && document.body.textContent.includes('Synthetic prescribed medicine') && document.body.textContent.includes('1.2345')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('[name=\"visit.dan_do\"], [name=\"dose-0\"], [name=\"result.wbc\"]'))"), false)
  stage = 'patient private upload and lesion choices'
  await browser.wait("document.querySelector('input[name=images]')")
  const imagePath = join(temporary, 'synthetic.png'); await writeFile(imagePath, PNG)
  const document = await browser.call('DOM.getDocument')
  const input = await browser.call('DOM.querySelector', { nodeId: document.root.nodeId, selector: 'input[name=images]' })
  await browser.call('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [imagePath] })
  await browser.evaluate("(() => { const f=document.querySelector('input[name=images]').form; f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("document.body.textContent.includes('synthetic.png') && !document.querySelector('form[aria-busy=true]')")
  assert.equal(state.attachments.length, 1)
  await browser.clickText('button', 'Xem ảnh được cấp quyền')
  await browser.wait("document.querySelector('img.private-image')?.naturalWidth===1")
  await browser.clickText('button', 'Ẩn ảnh')
  await browser.fillIn('Ghi nhận đợt tổn thương mới', '[name=name]', 'Synthetic episode')
  await browser.submitIn('Ghi nhận đợt tổn thương mới', true)
  await browser.wait("document.body.textContent.includes('Synthetic episode') && document.querySelector('select[name=attachment]')")
  assert.equal(state.episodes.length, 1)
  await browser.clickText('summary', 'Xem chi tiết 41')
  await browser.fillIn('Thêm vị trí trên cơ thể', '[name=name]', 'Synthetic body location')
  await browser.submitIn('Thêm vị trí trên cơ thể')
  await browser.wait("[...document.querySelectorAll('select[name=location] option')].some(x=>x.value==='51')")
  await browser.fill('select[name=attachment]', '31'); await browser.fill('select[name=location]', '51')
  await browser.fillIn('Thêm ảnh tiến triển vào đợt này', '[name=taken]', '2026-11-07T10:00')
  await browser.fillIn('Thêm ảnh tiến triển vào đợt này', '[name=stage]', 'start')
  await browser.submitIn('Thêm ảnh tiến triển vào đợt này', true)
  await browser.wait("document.body.textContent.includes('Xem chi tiết 61')")
  assert.equal(state.photos.length, 1)
  await browser.fillIn('Cập nhật mốc và triệu chứng đã ghi nhận', '[name=diem_ngua_nrs]', '0')
  await browser.submitIn('Cập nhật mốc và triệu chứng đã ghi nhận')
  await browser.wait("!document.querySelector('form[aria-busy=true]') && document.querySelector('[name=diem_ngua_nrs]')?.value==='0'")
  assert.equal(state.photos[0].diem_ngua_nrs, 0)
  stage = 'patient UAS zero/three and duplicate/readback'
  await browser.clickText('a', 'Nhật ký UAS')
  await browser.wait("document.body.textContent.includes('Chọn hồ sơ này để ghi UAS')")
  await browser.clickText('button', 'Chọn hồ sơ này để ghi UAS')
  await browser.wait("document.querySelector('[name=hss]')")
  await browser.fill('[name=hss]', '0'); await browser.fill('[name=iss]', '3')
  await browser.evaluate("(() => { const f=document.querySelector('[name=hss]').form; f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("document.body.textContent.includes('Đã lưu điểm ngày')")
  assert.equal(state.dailyAttempts, 1); assert.equal(state.daily.length, 1)
  stage = 'patient UAS duplicate selection'
  await browser.clickText('a', 'Tổng quan'); await browser.wait("location.pathname==='/portal'")
  await browser.clickText('a', 'Nhật ký UAS')
  await browser.wait("document.body.textContent.includes('Chọn hồ sơ này để ghi UAS')")
  await browser.clickText('button', 'Chọn hồ sơ này để ghi UAS')
  await browser.wait("document.querySelector('[name=hss]')")
  await browser.fill('[name=hss]', '0'); await browser.fill('[name=iss]', '3')
  await browser.evaluate("document.querySelector('[name=hss]').form.requestSubmit()")
  await browser.wait("document.querySelector('[role=alert]') && document.querySelector('fieldset:disabled')")
  stage = 'patient UAS duplicate blocked and readback'
  await browser.evaluate("document.querySelector('[name=hss]').form.requestSubmit()")
  assert.equal(state.dailyAttempts, 2)
  await browser.clickText('button', 'Đọc lại dữ liệu')
  await browser.wait(`!document.querySelector('[role=alert]') && document.body.textContent.includes(${JSON.stringify(state.daily[0].ngay_cham_diem)})`)
  stage = 'patient own profile remains signed in and responsive layout'
  await browser.clickText('a', 'Tài khoản của tôi')
  await browser.wait("document.querySelector('#full-name')")
  assert.equal(await browser.evaluate("[...document.querySelectorAll('input,select')].every(x=>x.labels.length>0)"), true)
  await browser.fill('#full-name', 'Synthetic updated patient')
  await browser.evaluate("document.querySelector('#full-name').form.requestSubmit()")
  await browser.wait("document.body.textContent.includes('Đã cập nhật thông tin cá nhân') && document.querySelector('aside').textContent.includes('Synthetic updated patient')")
  await browser.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), true)
  stage = 'patient completed record and 401 logout'
  state.status = 'completed'
  await spa('/portal/records/21')
  await browser.wait("document.body.textContent.includes('Hồ sơ chỉ được xem.') && document.body.textContent.includes('Synthetic episode')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('input[name=images], input[name=name], select[name=attachment], input[name=diem_ngua_nrs]'))"), false)
  state.expire = true
  await browser.clickText('a', 'Hồ sơ của tôi')
  await browser.wait("location.pathname==='/login' && document.querySelector('#password')")
  stage = 'ambiguous signup outcome does not resend'
  for (const username of ['synthetic-malformed', 'synthetic-uncertain']) {
  await browser.clickText('a', 'Đăng ký tài khoản')
  await browser.wait("document.querySelector('#signup-name')")
  await browser.fill('#signup-name', 'Synthetic uncertain patient'); await browser.fill('#signup-phone', '0000000000')
  await browser.fill('#signup-username', username); await browser.fill('#signup-password', 'synthetic-patient-password'); await browser.fill('#signup-confirm', 'synthetic-patient-password')
  await browser.evaluate("document.querySelector('form').requestSubmit()")
  await browser.wait("document.querySelector('[role=alert]') && document.querySelector('fieldset:disabled')")
  await browser.evaluate("document.querySelector('form').requestSubmit()")
  await browser.clickText('a', 'Đăng nhập'); await browser.wait("document.querySelector('#password')")
  }
  assert.equal(state.signups, 3); assert.equal(state.staffCalls, 0)
  console.log('PASS PATIENT: signup/mismatch/duplicate/uncertain recovery, subtype guards, own records/RX/labs/403/404, private upload/Blob, lesion choices/metrics, daily UAS/409/readback, own profile, mobile layout, completed read-only and401. Synthetic localhost API; no real DB/provider writes.')
}
let vite, chrome, temporary, browser
try {
  temporary = await mkdtemp(join(tmpdir(), 'mayday-browser-'))
  api.listen(0, '127.0.0.1'); await once(api, 'listening')
  vite = await createServer({ root, configFile: false, envDir: false, plugins: [react()], logLevel: 'silent',
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/') },
    server: { host: '127.0.0.1', port: 0, proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}` } } } })
  await vite.listen()
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`
  chrome = spawn(process.env.MAYDAY_TEST_CHROME || '/usr/bin/google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check',
    '--password-store=basic', '--use-mock-keychain', '--disable-background-networking', '--disable-sync',
    '--disable-features=PasswordManagerOnboarding,PasswordLeakDetection,AutofillServerCommunication',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${temporary}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] })
  let launchError
  chrome.on('error', (error) => { launchError = error })
  let port
  for (let attempt = 0; attempt < 200; attempt++) {
    if (launchError || chrome.exitCode !== null) throw new Error('Isolated browser unavailable')
    try { port = (await readFile(join(temporary, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await delay(50) }
  }
  if (!port) throw new Error('Isolated browser did not start')
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  const socket = new WebSocket(target.webSocketDebuggerUrl); await once(socket, 'open')
  browser = new DevTools(socket)
  await browser.call('Page.enable'); await browser.call('Runtime.enable')
  if (patientMode) await patientWorkflow(browser, origin, temporary)
  else {
  stage = 'login and keyboard'
  await browser.call('Page.navigate', { url: `${origin}/login` })
  await browser.wait("Boolean(document.querySelector('#username'))")
  await browser.evaluate("document.querySelector('#username').focus()")
  await browser.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  await browser.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  assert.equal(await browser.evaluate('document.activeElement.id'), 'password')
  await browser.fill('#username', 'synthetic'); await browser.fill('#password', 'synthetic-browser-password')
  await browser.evaluate("document.querySelector('form').requestSubmit()")
  await browser.wait("location.pathname==='/patients' && document.body.textContent.includes('Synthetic browser patient')")
  stage = 'first contact no match and permission errors'
  await browser.clickText('a', 'Tiếp nhận tài khoản bệnh nhân lần đầu')
  await browser.wait("location.pathname==='/patients/first-contact' && document.querySelector('[name=username]')")
  assert.equal(await browser.evaluate("[...document.querySelectorAll('input,select')].every(x=>x.labels.length>0)"), true)
  for (const username of ['synthetic-no-match', 'synthetic-denied']) {
    await browser.fill('[name=username]', username); await browser.fill('[name=phone]', '0000000000')
    await browser.evaluate("document.querySelector('form').requestSubmit()")
    await browser.wait("document.querySelector('[role=alert]') && document.querySelector('fieldset:disabled')")
    assert.equal(await browser.evaluate("document.body.textContent.includes('Synthetic browser patient')"), false)
    await browser.clickText('button', 'Đọc lại dữ liệu')
    await browser.wait("document.querySelector('[name=username]')?.value==='' && !document.querySelector('[role=alert]')")
  }
  stage = 'first contact exact identity and duplicate submits'
  await browser.fill('[name=username]', 'synthetic-first-contact'); await browser.fill('[name=phone]', '0000000000')
  await browser.evaluate("(() => { const f=document.querySelector('form'); f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("document.querySelector('[name=type]') && document.body.textContent.includes('Synthetic browser patient')")
  assert.equal(state.firstLookups, 3)
  await browser.fill('[name=date]', '2026-11-07'); await browser.fill('[name=type]', caseType)
  await browser.evaluate("(() => { const f=document.querySelector('[name=type]').form; f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("location.pathname==='/medical-records/20' && document.body.textContent.includes('Bắt đầu khám')")
  assert.equal(state.firstIntakes, 1)
  await browser.clickText('a', 'Bệnh nhân')
  await browser.wait("location.pathname==='/patients' && document.body.textContent.includes('Synthetic browser patient')")
  stage = 'existing patient and duplicate intake'
  await browser.clickText('a', 'Xem 11')
  await browser.wait("location.pathname==='/patients/11' && document.body.textContent.includes('Tạo hồ sơ mới cho bệnh nhân này')")
  stage = 'existing patient form loaded'
  await browser.fill('input[name="date"]', '2026-11-07')
  await browser.fill('select[name="type"]', caseType)
  await browser.submitIn('Tạo hồ sơ mới cho bệnh nhân này', true)
  stage = 'existing patient intake response and navigation'
  await browser.wait("location.pathname==='/medical-records/22' && document.body.textContent.includes('Bắt đầu khám')")
  assert.equal(state.intakes, 1)
  stage = 'private media upload and authorized blob view'
  await browser.wait("Boolean(document.querySelector('input[name=images]'))")
  const imagePath = join(temporary, 'synthetic.png'); await writeFile(imagePath, PNG)
  const document = await browser.call('DOM.getDocument')
  const input = await browser.call('DOM.querySelector', { nodeId: document.root.nodeId, selector: 'input[name=images]' })
  await browser.call('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [imagePath] })
  await browser.evaluate("(() => { const f=document.querySelector('input[name=images]').form; f.requestSubmit(); f.requestSubmit(); })()")
  await browser.wait("document.body.textContent.includes('synthetic.png') && !document.querySelector('form[aria-busy=true]')")
  assert.equal(state.attachments.length, 1)
  await browser.clickText('summary', 'Xem chi tiết 31')
  await browser.clickText('button', 'Xem ảnh được cấp quyền')
  await browser.wait("document.querySelector('img.private-image')?.complete && document.querySelector('img.private-image')?.naturalWidth===1")
  await browser.clickText('button', 'Ẩn ảnh')
  assert.equal(await browser.evaluate("Boolean(document.querySelector('img.private-image'))"), false)
  await browser.clickText('button', 'Bắt đầu khám')
  await browser.wait("document.body.textContent.includes('Hoàn tất hồ sơ') && document.querySelector('a[href=\"/medical-records/22/visits/66\"]')")
  await browser.clickText('a', 'Xem 66')
  await browser.wait("location.pathname.endsWith('/visits/66') && document.querySelector('[name=\"visit.dan_do\"]')")
  stage = 'visit save and mandatory readback after ambiguous failure'
  assert.equal(await browser.evaluate("[...document.querySelectorAll('input,select,textarea')].every(x=>x.labels.length>0)"), true)
  await browser.fill('[name="visit.dan_do"]', 'Synthetic committed advice')
  await browser.submitIn('Nhập và sửa nội dung khám')
  await browser.wait("document.querySelector('[role=alert]') && [...document.querySelectorAll('button')].some(x=>x.textContent==='Đọc lại dữ liệu')")
  await browser.submitIn('Nhập và sửa nội dung khám', true)
  assert.equal(state.updates, 1)
  await browser.clickText('button', 'Đọc lại dữ liệu')
  await browser.wait("document.querySelector('[name=\"visit.dan_do\"]')?.value==='Synthetic committed advice' && !document.querySelector('[role=alert]')")
  await browser.fill('[name="visit.dan_do"]', 'Synthetic confirmed advice')
  await browser.submitIn('Nhập và sửa nội dung khám')
  await browser.wait("document.querySelector('[name=\"visit.dan_do\"]')?.value==='Synthetic confirmed advice' && !document.querySelector('form[aria-busy=true]')")
  assert.equal(state.updates, 2)
  stage = 'prescribing and duplicate submit'
  await browser.fill('input[name="date"]', '2026-11-07')
  await browser.fill('input[name="name-0"]', 'Synthetic medication')
  await browser.fill('input[name="dose-0"]', 'Synthetic dose')
  await browser.fill('input[name="duration-0"]', 'Synthetic duration')
  await browser.submitIn('Kê đơn cho phiên khám', true)
  await browser.wait("document.body.textContent.includes('Synthetic medication') && !document.querySelector('form[aria-busy=true]')")
  assert.equal(state.prescriptions.length, 1)
  stage = 'lab numeric precision'
  await browser.fill('[name="result.wbc"]', '0.0000'); await browser.fill(`[name="detail.${caseType === 'CAP' ? 'lym' : 'anti_tpo'}"]`, '1.2345')
  await browser.submitIn(`Nhập kết quả cận lâm sàng ${caseType === 'CAP' ? 'cấp' : 'mạn'}`)
  await browser.wait("document.body.textContent.includes('1.2345') && !document.querySelector('form[aria-busy=true]')")
  assert.equal(state.labs.length, 1)
  stage = 'completion removes write affordances'
  await browser.clickText('a', '← Hồ sơ bệnh án')
  await browser.wait("location.pathname==='/medical-records/22' && document.body.textContent.includes('Hoàn tất hồ sơ')")
  await browser.clickText('button', 'Hoàn tất hồ sơ')
  await browser.wait("document.body.textContent.includes('Hồ sơ đã hoàn tất.') && document.querySelector('a[href=\"/medical-records/22/visits/66\"]')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('input[name=images]'))"), false)
  await browser.clickText('a', 'Xem 66')
  await browser.wait("document.body.textContent.includes('Nội dung chỉ được xem.')")
  assert.equal(await browser.evaluate("Boolean(document.querySelector('[name=\"visit.dan_do\"], [name=\"dose-0\"], [name=\"result.wbc\"]'))"), false)
  stage = '401 expires memory session'
  state.expire = true
  await browser.clickText('a', '← Hồ sơ bệnh án')
  await browser.wait("location.pathname==='/login' && document.querySelector('#password')")
  console.log(`PASS ${caseType}: first-contact exact lookup/404/403/one-time intake, existing intake, keyboard labels, private upload/blob view, duplicate submits, mutation readback, prescribing/labs, completed read-only, 401 session expiry. Stateful synthetic API only; no PostgreSQL writes.`)
  }
} catch (error) {
  console.error(`FAIL at ${stage}: ${error.message}`)
  process.exitCode = 1
} finally {
  browser?.socket.close()
  if (chrome?.pid && chrome.exitCode === null && chrome.signalCode === null) {
    const stopped = once(chrome, 'exit').catch(() => {})
    chrome.kill('SIGTERM')
    await Promise.race([stopped, delay(2000)])
    if (chrome.exitCode === null) { chrome.kill('SIGKILL'); await stopped }
  }
  await vite?.close()
  api.closeAllConnections()
  if (api.listening) await new Promise((resolve) => api.close(resolve))
  if (temporary) await rm(temporary, { recursive: true, force: true })
}
