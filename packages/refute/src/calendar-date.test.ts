import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const range = $.exact({
  from: $.calendarDate,
  to: $.calendarDate
})

await test('not a string', () => {
  assert.deepEqual(range({ from: 1, to: 2 }), $.fail(1, 'at key from, expected string'))
})

await test('valid', () => {
  assert.deepEqual(range(JSON.parse('{"from":"2001-01-01","to":"2001-01-02"}')), $.ok({
    from: '2001-01-01',
    to: '2001-01-02'
  }))
})

await test('not valid date string', () => {
  assert.deepEqual($.safeReason(range)(JSON.parse('{"from":"2001-01-01","to":"today"}')), 'Invalid value at key to, expected YYYY-MM-DD string.')
})

await test('not a valid date', () => {
  assert.deepEqual($.safeReason(range)(JSON.parse('{"from":"2001-01-01","to":"2001-13-01"}')), 'Invalid value at key to, expected valid date.')
})

await test('non-existent dates are rejected instead of rolling over', () => {
  for (const value of [ '2025-02-30', '2023-02-29', '2025-04-31', '2025-00-10', '2025-01-00', '2025-01-32' ]) {
    assert.deepEqual($.safeReason($.calendarDate)(value), 'Invalid value expected valid date.', value)
  }
  for (const value of [ '2024-02-29', '2025-01-31', '2000-02-29', '1900-02-28' ]) {
    assert.deepEqual($.calendarDate(value), $.ok(value), value)
  }
  assert.equal($.failed($.calendarDate('1900-02-29')), true)
})
