import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSession, isSessionActive, sessionHome } from '../src/features/auth/session.js'
import { businessPath } from '../src/shared/api/business-path.js'
import { ApiError, performRequest } from '../src/shared/api/request.js'

test('session lifetime is finite and expires at the exact boundary', () => {
  const session = createSession({ token: 'synthetic-token', expires_in: 900, user_info: { account_id: '1', staff_id: '1' } }, 1000)
  assert.equal(isSessionActive(session, 1000), true)
  assert.equal(isSessionActive(session, 901000), false)
  assert.equal(isSessionActive(null), false)
  const patient = createSession({ token: 'synthetic-token', expires_in: 900, user_info: { patient_id: '1', staff_id: null } })
  assert.equal(sessionHome(patient.user), '/portal')
  assert.equal(sessionHome({ staff_id: '7', patient_id: '1' }), '/patients')
  assert.equal(sessionHome({ staff_id: '7' }), '/patients')
  assert.equal(sessionHome({}), '/login')
  assert.throws(() => createSession({ token: 'synthetic-token', expires_in: 900, user_info: {} }), /chưa có hồ sơ/)
  for (const data of [null, {}, { token: 'token', expires_in: -1, user_info: {} }]) {
    assert.throws(() => createSession(data), /không hợp lệ/)
  }
})

test('business endpoint prefix is included once for root and prefixed backends', () => {
  assert.equal(businessPath('/patients', '/'), 'api/v1/patients')
  assert.equal(businessPath('/patients?page=2', '/api/v1'), 'patients?page=2')
  assert.equal(businessPath('/auth/login', 'https://backend.example/api/v1/'), 'auth/login')
  assert.equal(businessPath('/auth/login', 'https://backend.example/'), 'api/v1/auth/login')
})

test('API adapter passes bearer token and returns only envelope data', async () => {
  const controller = new AbortController()
  let request
  const client = { request: async (config) => {
    request = config
    return { status: 200, data: { code: '1000', message: 'OK', data: { items: [] } } }
  } }
  assert.deepEqual(await performRequest(client, 'patients', { token: 'synthetic-token', signal: controller.signal }), { items: [] })
  assert.equal(request.headers.Authorization, 'Bearer synthetic-token')
  assert.equal(request.signal, controller.signal)
})

test('permission and network failures are errors without leaking backend details', async () => {
  const client = { request: async () => { throw { response: { status: 403, data: { message: 'synthetic private details' } } } } }
  await assert.rejects(performRequest(client, 'patients'), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 403)
    assert.doesNotMatch(error.message, /synthetic private/)
    return true
  })
  await assert.rejects(performRequest({ request: async () => { throw new Error('private network detail') } }, 'patients'), (error) => error.status === 0 && !error.message.includes('private network'))
})

test('HTTP success with a business failure is never treated as usable data', async () => {
  const client = { request: async () => ({ status: 200, data: { code: '3101', data: { items: [] } } }) }
  await assert.rejects(performRequest(client, 'patients'), ApiError)
})
