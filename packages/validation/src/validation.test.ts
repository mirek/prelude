import * as V from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('failures carry the path, the structured expectation and the innermost value', () => {
  const message = V.object({ method: V.string, params: V.tuple(V.number, V.nullOr(V.string)) })
  assert.deepEqual(message({ method: 'add', params: [ 1, 'x' ] }), { ok: true, value: { method: 'add', params: [ 1, 'x' ] } })
  assert.deepEqual(message({ method: 'add', params: [ 1, 2 ] }), {
    ok: false,
    path: [ { kind: 'key', key: 'params' }, { kind: 'index', index: 1 }, { kind: 'or', alternative: 'null' } ],
    expected: { kind: 'type', name: 'string' },
    received: 2
  })
  assert.deepEqual(message(null), { ok: false, path: [], expected: { kind: 'type', name: 'object' }, received: null })
})

await test('containers report their own structural failures', () => {
  assert.deepEqual(V.exact({ a: V.string })({ a: 'x', b: 1, c: 2 }), { ok: false, path: [], expected: { kind: 'extraKeys', keys: [ 'b', 'c' ], partial: false }, received: { a: 'x', b: 1, c: 2 } })
  assert.deepEqual(V.tuple(V.number)([ 1, 2 ]), { ok: false, path: [], expected: { kind: 'maxLength', length: 1 }, received: [ 1, 2 ] })
  assert.deepEqual(V.unique(V.number)([ 1, 2, 1 ]), { ok: false, path: [ { kind: 'index', index: 2 } ], expected: { kind: 'unique' }, received: 1 })
  assert.deepEqual(V.record(V.regexp(/^[a-z]+$/), V.number)({ a1: 1 }), { ok: false, path: [ { kind: 'keyOf', key: 'a1' } ], expected: { kind: 'regexp', regexp: /^[a-z]+$/ }, received: 'a1' })
  const union = V.or(V.string, V.number)(true)
  assert.equal(union.ok, false)
  assert.equal(!union.ok && union.expected.kind === 'union' && union.expected.failures.length, 2)
})

await test('exact validators use own properties, so a declared __proto__ key works and inherited names are extra', () => {
  const validator = V.exact({ [ '__proto__' ]: V.string })
  assert.equal(validator(JSON.parse('{"__proto__":"x"}')).ok, true)
  assert.equal(validator({}).ok, false)
  assert.equal(V.exact({ a: V.number })({ a: 1, constructor: 1 }).ok, false)
})

await test('lift, wrapped and unwrap', () => {
  assert.equal(V.lift('a')('a').ok, true)
  assert.equal(V.lift(/^b/)('bc').ok, true)
  assert.equal(V.lift(null)(null).ok, true)
  assert.throws(() => V.lift({} as never), TypeError)
  const guard = V.wrapped((value: unknown): value is string => typeof value === 'string', V.string)
  assert.equal(V.unwrap(guard), V.string)
  assert.equal(V.unwrap(() => true), undefined)
  assert.equal(V.unwrap('not a function'), undefined)
})

await test('strftime and calendarDate', () => {
  assert.deepEqual(V.strftime('%Y-%m-%d')('2022-1-1'), { ok: false, path: [], expected: { kind: 'strftime', format: '%Y-%m-%d', index: 5 }, received: '2022-1-1' })
  assert.equal(V.calendarDate('2024-02-29').ok, true)
  assert.deepEqual(V.calendarDate('2023-02-29'), { ok: false, path: [], expected: { kind: 'calendarDate', problem: 'invalid' }, received: '2023-02-29' })
})
