import { test } from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { resolveHealthUrl } from '../src/shared/api/health-url.js'

test('default and relative business prefixes use same-origin root health', () => {
  for (const base of [undefined, '/', '/api/v1', '/api/v1/', 'api/v1']) {
    assert.equal(resolveHealthUrl(base), '/health')
  }
})

test('absolute API base keeps the backend origin and removes the business path', () => {
  assert.equal(resolveHealthUrl('https://backend.example/api/v1'), 'https://backend.example/health')
  assert.equal(resolveHealthUrl('http://localhost:3000/api/v1/'), 'http://localhost:3000/health')
  assert.equal(resolveHealthUrl('//backend.example:3000/api/v1'), '//backend.example:3000/health')
})

test('explicit technical endpoint override wins over the API base', () => {
  assert.equal(resolveHealthUrl('/api/v1', '/ops/live'), '/ops/live')
  assert.equal(resolveHealthUrl('https://backend.example/api/v1', 'https://monitor.example/live'), 'https://monitor.example/live')
})

test('health request bypasses Axios business prefix without changing the client', async () => {
  for (const baseURL of ['/api/v1', 'https://backend.example/api/v1']) {
    const client = axios.create({ baseURL })
    let requestedUrl
    await client.get(resolveHealthUrl(baseURL), {
      baseURL: '/',
      adapter: async (config) => {
        requestedUrl = client.getUri(config)
        return { data: { status: 'ok' }, status: 200, statusText: 'OK', headers: {}, config }
      },
    })
    assert.equal(requestedUrl, baseURL.startsWith('https:') ? 'https://backend.example/health' : '/health')
    assert.equal(client.defaults.baseURL, baseURL)
  }
})
