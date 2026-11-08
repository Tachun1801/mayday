import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMediaClient, MAX_IMAGE_BYTES } from '../src/shared/api/media-request.js'

test('media uploads send bytes/auth header without a direct Cloudinary URL or token in query', async () => {
  let request
  const file = new File(['synthetic'], 'Ảnh tổng hợp.png', { type: 'image/png' })
  const client = createMediaClient({ async request(options) { request = options; return { data: { code: '1000', data: { id: '31', record_id: '21' } } } } })
  assert.equal((await client.uploadImage('/medical-records/21/attachments', file, { token: 'synthetic-token' })).id, '31')
  assert.equal(request.url, 'api/v1/medical-records/21/attachments'); assert.equal(request.data, file); assert.equal(request.headers['Content-Type'], 'image/png'); assert.equal(request.headers['X-File-Name'], encodeURIComponent(file.name)); assert.equal(request.headers.Authorization, 'Bearer synthetic-token'); assert.ok(!request.url.includes('synthetic-token'))
})
test('media client rejects over-size/unsupported uploads before network and malformed success replies', async () => {
  let calls = 0
  const client = createMediaClient({ async request() { calls++; return { data: { code: '1000', data: {} } } } })
  for (const file of [new File(['<svg/>'], 'synthetic.svg', { type: 'image/svg+xml' }), new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'synthetic.png', { type: 'image/png' })]) await assert.rejects(client.uploadImage('/synthetic', file, { token: 'synthetic' }))
  assert.equal(calls, 0)
  await assert.rejects(client.uploadImage('/synthetic', new File(['synthetic'], 'synthetic.png', { type: 'image/png' }), { token: 'synthetic' }))
})
test('private content is fetched as bounded image blobs and 401 remains a controlled auth error', async () => {
  const blob = new Blob(['synthetic'], { type: 'image/png' })
  const client = createMediaClient({ async request(options) { assert.equal(options.responseType, 'blob'); assert.equal(options.headers.Authorization, 'Bearer synthetic'); return { data: blob, headers: { 'content-type': 'image/png' } } } })
  assert.equal(await client.fetchImage('/synthetic/content', { token: 'synthetic' }), blob)
  const invalid = createMediaClient({ async request() { return { data: new Blob(['{}'], { type: 'application/json' }), headers: { 'content-type': 'image/png' } } } })
  await assert.rejects(invalid.fetchImage('/synthetic'))
  const unauthorized = createMediaClient({ async request() { throw { response: { status: 401 } } } })
  await assert.rejects(unauthorized.fetchImage('/synthetic'), (error) => error.status === 401 && !error.message.includes('Cloudinary'))
})
