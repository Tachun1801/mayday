import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inputValue, changedFields } from '../src/features/medical-records/clinical-form.js'
import { editorFields } from '../src/features/medical-records/editor-fields.js'

test('clinical form preserves decimal strings, zero/false, nulls and untouched fields', () => {
  const definitions = { amount: { type: 'decimal' }, flag: { type: 'boolean' }, count: { type: 'integer' }, note: { type: 'text' } }
  const initial = { amount: '1.2345', flag: false, count: 0, note: 'Synthetic' }
  const form = new FormData()
  for (const [key, value] of Object.entries(initial)) form.set(`detail.${key}`, String(value))
  assert.deepEqual(changedFields(form, 'detail.', definitions, initial), {})
  form.set('detail.amount', '0.0000'); form.set('detail.flag', 'true'); form.set('detail.note', '')
  assert.deepEqual(changedFields(form, 'detail.', definitions, initial), { amount: '0.0000', flag: true, note: null })
})
test('interval values round-trip into explicit ISO durations and unknown objects are never stringified', () => {
  assert.equal(inputValue({ days: 2, hours: 3 }, { type: 'interval' }), 'P0Y0M2DT3H0M0S')
  assert.equal(inputValue({ secret: 'MUST_NOT_RENDER' }, { type: 'text' }), '')
  assert.equal(inputValue(false, { type: 'boolean' }), 'false')
})
test('forms expose only fixed writable fields, with subtype precision and enum values', () => {
  assert.equal(editorFields.ketquacanlamsang.wbc.scale, 4)
  assert.equal(editorFields.ketquacanlamsangcap.nlr, undefined)
  assert.equal(editorFields.phienkham.ma_bac_si, undefined)
  assert.equal(editorFields.hosobenhan.trang_thai, undefined)
  assert.equal(editorFields.phienkhamman.diem_aas7, undefined)
  assert.ok(editorFields.benhanmaydayman.chan_doan_chinh.options.includes('CSU'))
})

test('invalid integer input cannot become JSON null and silently clear a stored count', () => {
  for (const value of ['NaN', 'Infinity', '1.5', '1e3', '99999999999999999']) {
    const form = new FormData(); form.set('count', value)
    assert.throws(() => changedFields(form, '', { count: { type: 'integer', min: 0, max: 2147483647 } }, { count: 1 }))
  }
})
