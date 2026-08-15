import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('leading literals are matched in full', () => {
  assert.equal($.strftime('T%H')('T12'), true)
  assert.equal($.strftime('T%H')('12'), false)
  assert.equal($.strftime('AB%H')('AB12'), true)
  assert.equal($.strftime('AB%H')('B12'), false)
  assert.equal($.strftime('abc')('abc'), true)
  assert.equal($.strftime('abc')('bc'), false)
})

await test('literals between and after rules', () => {
  assert.equal($.strftime('%H:%M')('12:34'), true)
  assert.equal($.strftime('%H:%M')('1234'), false)
  assert.equal($.strftime('%HX%M')('12X34'), true)
  assert.equal($.strftime('%H:%M!')('12:34!'), true)
  assert.equal($.strftime('%H:%M!')('12:34'), false)
  assert.equal($.strftime('%Y-%m-%dT%H:%M:%SZ')('2024-02-29T23:59:59Z'), true)
  assert.equal($.strftime('%Y-%m-%dT%H:%M:%SZ')('2024-02-29T23:59:59'), false)
  assert.equal($.strftime('%F %T')('2024-02-29 23:59:59'), true)
})

await test('escaped percent and unknown rules', () => {
  assert.equal($.strftime('100%%')('100%'), true)
  assert.throws(() => $.strftime('%Q')('x'), /Unknown strftime rule/)
})
