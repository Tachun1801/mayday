import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextRecordAction, validateStatusResponse } from '../src/features/medical-records/record-workflow.js'

test('Web exposes only owner-approved forward transitions', () => {
  assert.deepEqual(nextRecordAction('draft'), { status: 'in_progress', label: 'Bắt đầu khám' })
  assert.deepEqual(nextRecordAction('in_progress'), { status: 'completed', label: 'Hoàn tất hồ sơ' })
  for (const status of ['completed', 'pending', 'cancelled', null, undefined, 'unknown']) {
    assert.equal(nextRecordAction(status), null)
  }
})

test('status response must match both the exact bigint ID and requested state', () => {
  const id = '9007199254740993'
  assert.deepEqual(validateStatusResponse({ id, status: 'completed' }, id, 'completed'), { id, status: 'completed' })
  for (const data of [null, {}, { id: '9007199254740992', status: 'completed' }, { id, status: 'in_progress' }, { id: 1, status: 'completed' }]) {
    assert.throws(() => validateStatusResponse(data, id, 'completed'), /tải lại hồ sơ/)
  }
})
