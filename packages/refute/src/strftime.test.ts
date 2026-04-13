import * as $ from './index.js'
import * as Strftime from './strftime.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('tokenize', () => {
  assert.deepEqual(Strftime.tokenize(''), [])
  assert.deepEqual(Strftime.tokenize('%%'), [{ type: 'literal', value: '%' }])
  assert.deepEqual(Strftime.tokenize('abc%Tabc'), [
    { type: 'literal', value: 'a' },
    { type: 'literal', value: 'b' },
    { type: 'literal', value: 'c' },
    { type: 'regexp', value: /^(0[0-9]|1[0-9]|2[0-3])/ },
    { type: 'literal', value: ':' },
    { type: 'regexp', value: /^[0-5][0-9]/ },
    { type: 'literal', value: ':' },
    { type: 'regexp', value: /^[0-5][0-9]/ },
    { type: 'literal', value: 'a' },
    { type: 'literal', value: 'b' },
    { type: 'literal', value: 'c' }
  ])
})

await test('strftime', () => {
  assert.deepEqual($.strftime('')(''), $.ok(''))
  assert.deepEqual($.strftime('')(null), $.fail(null, 'expected string'))
  assert.deepEqual($.strftime('abc')('aaa'), $.fail({ value: 'aaa', index: 1 }, 'expected abc strftime, failed at index 1'))
  assert.throws(() => $.strftime('%Q'), /Unknown strftime rule %Q\./)
  assert.deepEqual($.strftime('%Y-%m-%d')('2022-01-01'), $.ok('2022-01-01'))
  assert.deepEqual($.strftime('%Y-%m-%d')('2022-01-01a'), $.fail({ value: '2022-01-01a', index: 10 }, 'expected %Y-%m-%d strftime, failed at index 10'))
  assert.deepEqual($.strftime('%Y-%m-%d')('22-01-01'), $.fail({ value: '22-01-01', index: 0 }, 'expected %Y-%m-%d strftime, failed at index 0'))
  assert.deepEqual($.strftime('%T')('01:01:01'), $.ok('01:01:01'))
  assert.deepEqual($.strftime('%T')('25:01:01'), $.fail({ value: '25:01:01', index: 0 }, 'expected %T strftime, failed at index 0'))
})
