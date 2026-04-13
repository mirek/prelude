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
