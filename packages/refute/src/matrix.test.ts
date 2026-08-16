import * as R from './index.js'
import * as A from '@prelude/assert'
import * as P from '@prelude/predicate'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Behaviour matrix: the same validator built in each of the three packages must
// agree on every sample — refute's result, assert's throw/return and the
// predicate's boolean — and refute's reason path must be assert's error path.

type Row = {
  name: string,
  assert: A.Assert<unknown>,
  refute: R.Refute<unknown>,
  predicate?: P.Predicate<unknown>,
  samples: unknown[]
}

class Foo {}

const rows: Row[] = [
  { name: 'string', assert: A.string, refute: R.string, predicate: P.string, samples: [ 'a', '', 1, null, undefined ] },
  { name: 'number', assert: A.number, refute: R.number, predicate: P.number, samples: [ 1, NaN, '1', null ] },
  { name: 'boolean', assert: A.boolean, refute: R.boolean, predicate: P.boolean, samples: [ true, false, 0, 'true' ] },
  { name: 'bigint', assert: A.bigint, refute: R.bigint, samples: [ 1n, 1, '1' ] },
  { name: 'symbol', assert: A.symbol, refute: R.symbol, samples: [ Symbol('x'), 'x' ] },
  { name: 'undefined', assert: A.undefined, refute: R.undefined, predicate: P.undefined, samples: [ undefined, null, 0 ] },
  { name: 'null', assert: A.null, refute: R.null, predicate: P.null, samples: [ null, undefined, 0 ] },
  { name: 'true', assert: A.true, refute: R.true, samples: [ true, false, 1 ] },
  { name: 'false', assert: A.false, refute: R.false, samples: [ false, true, 0 ] },
  { name: 'unknown', assert: A.unknown, refute: R.unknown, predicate: P.unknown, samples: [ 1, undefined, {} ] },
  { name: 'finite', assert: A.finite, refute: R.finite, predicate: P.finite, samples: [ 1, Infinity, NaN, '1' ] },
  { name: 'safeInteger', assert: A.safeInteger, refute: R.safeInteger, predicate: P.safeInteger, samples: [ 1, 1.5, 2 ** 53, '1' ] },
  { name: 'positive', assert: A.positive, refute: R.positive, predicate: P.positive, samples: [ 1, 0, -1, '1' ] },
  { name: 'gt(1)', assert: A.gt(1), refute: R.gt(1), predicate: P.gt(1), samples: [ 2, 1, 0, '2' ] },
  { name: 'gte(1)', assert: A.gte(1), refute: R.gte(1), predicate: P.gte(1), samples: [ 2, 1, 0 ] },
  { name: 'lt(1)', assert: A.lt(1), refute: R.lt(1), predicate: P.lt(1), samples: [ 0, 1, 2 ] },
  { name: 'lte(1)', assert: A.lte(1), refute: R.lte(1), predicate: P.lte(1), samples: [ 0, 1, 2 ] },
  { name: 'between(1, 3)', assert: A.between(1, 3), refute: R.between(1, 3), samples: [ 1, 2, 3, 0, 4, '2' ] },
  { name: "eq('a')", assert: A.eq('a'), refute: R.eq('a'), predicate: P.eq('a'), samples: [ 'a', 'b', 1 ] },
  { name: 'is(NaN)', assert: A.is(NaN), refute: R.is(NaN), samples: [ NaN, 0, 'NaN' ] },
  { name: "oneOf('a', 'b')", assert: A.oneOf('a', 'b'), refute: R.oneOf('a', 'b'), predicate: P.oneOf('a', 'b'), samples: [ 'a', 'b', 'c', 1 ] },
  { name: 'regexp(/^a+$/)', assert: A.regexp(/^a+$/), refute: R.regexp(/^a+$/), predicate: P.regexp(/^a+$/), samples: [ 'aa', 'ab', '', 1 ] },
  { name: 'regexp(/a/g) twice', assert: A.regexp(/a/g), refute: R.regexp(/a/g), predicate: P.regexp(/a/g), samples: [ 'a', 'a', 'b' ] },
  { name: 'instance(Foo)', assert: A.instance(Foo), refute: R.instance(Foo), predicate: P.instance(Foo), samples: [ new Foo(), {}, null ] },
  { name: 'array(string)', assert: A.array(A.string), refute: R.array(R.string), predicate: P.array(P.string), samples: [ [], [ 'a' ], [ 'a', 1 ], 'a', null ] },
  { name: 'array(unknown)', assert: A.array(A.unknown), refute: R.array(R.unknown), predicate: P.array(P.unknown), samples: [ [ 1, 'a' ], {} ] },
  { name: 'tuple(string, number)', assert: A.tuple(A.string, A.number), refute: R.tuple(R.string, R.number), predicate: P.tuple(P.string, P.number), samples: [ [ 'a', 1 ], [ 'a' ], [ 'a', 1, 2 ], [ 1, 'a' ], [] ] },
  { name: 'object({ a: string })', assert: A.object({ a: A.string }), refute: R.object({ a: R.string }), predicate: P.object({ a: P.string }), samples: [ { a: 'x' }, { a: 'x', b: 1 }, { a: 1 }, {}, null, [] ] },
  { name: 'partial({ a: string })', assert: A.partial({ a: A.string }), refute: R.partial({ a: R.string }), predicate: P.partial({ a: P.string }), samples: [ { a: 'x' }, {}, { a: undefined }, { a: 1 }, null ] },
  { name: 'exact({ a: string })', assert: A.exact({ a: A.string }), refute: R.exact({ a: R.string }), predicate: P.exact({ a: P.string }), samples: [ { a: 'x' }, { a: 'x', b: 1 }, { a: 1 }, {}, { a: 'x', constructor: 1 }, JSON.parse('{"a":"x","__proto__":{"b":1}}') ] },
  { name: 'exact({ __proto__: string })', assert: A.exact({ [ '__proto__' ]: A.string }), refute: R.exact({ [ '__proto__' ]: R.string }), predicate: P.exact({ [ '__proto__' ]: P.string }), samples: [ JSON.parse('{"__proto__":"x"}'), {}, JSON.parse('{"__proto__":1}') ] },
  { name: 'exactPartial({ a: string })', assert: A.exactPartial({ a: A.string }), refute: R.exactPartial({ a: R.string }), samples: [ { a: 'x' }, {}, { a: undefined }, { b: 1 }, { a: 1 } ] },
  { name: 'record(string, number)', assert: A.record(A.string, A.number), refute: R.record(R.string, R.number), predicate: P.record(P.number, P.string), samples: [ {}, { a: 1 }, { a: '1' }, null ] },
  { name: 'record(regexp, number)', assert: A.record(A.regexp(/^[a-z]+$/), A.number), refute: R.record(R.regexp(/^[a-z]+$/), R.number), predicate: P.record(P.number, P.regexp(/^[a-z]+$/)), samples: [ { a: 1 }, { a1: 1 }, { a: 'x' } ] },
  { name: 'unique(string)', assert: A.unique(A.string), refute: R.unique(R.string), predicate: P.unique(P.string), samples: [ [], [ 'a', 'b' ], [ 'a', 'a' ], [ 'a', 1 ], null ] },
  { name: 'unique(number, k)', assert: A.unique(A.number, x => Math.floor(x)), refute: R.unique(R.number, x => Math.floor(x)), predicate: P.unique(P.number, x => Math.floor(x)), samples: [ [ 1.1, 2.1 ], [ 1.1, 1.9 ] ] },
  { name: 'or(string, number)', assert: A.or(A.string, A.number), refute: R.or(R.string, R.number), samples: [ 'a', 1, true, null ] },
  { name: "or('a', null, /^b/)", assert: A.or('a', null, /^b/), refute: R.or('a', null, /^b/), samples: [ 'a', null, 'bc', 'c', 1 ] },
  { name: 'and(string, regexp)', assert: A.and(A.string, A.regexp(/^a/)), refute: R.and(R.string, R.regexp(/^a/)), predicate: P.intersection(P.string, P.regexp(/^a/)), samples: [ 'ab', 'b', 1 ] },
  { name: 'nullOr(string)', assert: A.nullOr(A.string), refute: R.nullOr(R.string), predicate: P.nullOr(P.string), samples: [ null, 'a', undefined, 1 ] },
  { name: 'undefinedOr(string)', assert: A.undefinedOr(A.string), refute: R.undefinedOr(R.string), predicate: P.undefinedOr(P.string), samples: [ undefined, 'a', null, 1 ] },
  { name: 'nullishOr(string)', assert: A.nullishOr(A.string), refute: R.nullishOr(R.string), predicate: P.nilOr(P.string), samples: [ null, undefined, 'a', 1 ] },
  { name: 'nullOr(object({ a: number }))', assert: A.nullOr(A.object({ a: A.number })), refute: R.nullOr(R.object({ a: R.number })), predicate: P.nullOr(P.object({ a: P.number })), samples: [ null, { a: 1 }, { a: 'x' }, 1 ] },
  { name: 'strftime(%Y-%m-%d)', assert: A.strftime('%Y-%m-%d'), refute: R.strftime('%Y-%m-%d'), predicate: P.strftime('%Y-%m-%d'), samples: [ '2022-01-01', '2022-1-1', 'x', 1 ] },
  { name: 'calendarDate', assert: A.calendarDate, refute: R.calendarDate, predicate: P.calendarDate, samples: [ '2024-02-29', '2023-02-29', '2024-2-9', 1 ] },
  { name: 'nullish', assert: A.nullish, refute: R.nullish, predicate: P.nil, samples: [ null, undefined, 0, '' ] },
  { name: 'nonBlankString', assert: A.nonBlankString, refute: R.nonBlankString, predicate: P.nonBlankString, samples: [ 'a', ' ', '', 1 ] },
  { name: 'exactPartial via predicate', assert: A.exactPartial({ a: A.string }), refute: R.exactPartial({ a: R.string }), predicate: P.exactPartial({ a: P.string }), samples: [ { a: 'x' }, {}, { b: 1 }, { a: 1 } ] },
  { name: 'union via predicate', assert: A.or(A.string, A.number), refute: R.or(R.string, R.number), predicate: P.union(P.string, P.number), samples: [ 'a', 1, true ] },
  { name: 'is/between/bigint/symbol via predicate', assert: A.tuple(A.is(-0), A.between(1, 2), A.bigint, A.symbol), refute: R.tuple(R.is(-0), R.between(1, 2), R.bigint, R.symbol), predicate: P.tuple(P.is(-0), P.between(1, 2), P.bigint, P.symbol), samples: [ [ -0, 1, 1n, Symbol.iterator ], [ 0, 1, 1n, Symbol.iterator ], [ -0, 3, 1n, Symbol.iterator ] ] },
  { name: 'nested object/array/tuple', assert: A.object({ foo: A.object({ bar: A.array(A.object({ baz: A.tuple(A.string, A.nullOr(A.number)) })) }) }), refute: R.object({ foo: R.object({ bar: R.array(R.object({ baz: R.tuple(R.string, R.nullOr(R.number)) })) }) }), predicate: P.object({ foo: P.object({ bar: P.array(P.object({ baz: P.tuple(P.string, P.nullOr(P.number)) })) }) }), samples: [ { foo: { bar: [ { baz: [ 'a', 1 ] }, { baz: [ 'b', null ] } ] } }, { foo: { bar: [ { baz: [ 'a', 'x' ] } ] } }, { foo: { bar: [ { baz: [ 'a', 1, 2 ] } ] } }, { foo: { bar: [ {} ] } }, { foo: null } ] }
]

/** `.foo.bar.0.baz` from an assert error, and from a refute reason. */
const assertPath = (error: A.AssertionError) => error.message.match(/^Expected (\.\S*) to be/)?.[1] ?? ''
const refutePath = (reason: string) => (reason.match(/(?:at (?:key|index) [^,]+, |key, )/g) ?? []).map(step => step.startsWith('key, ') ? '' : `.${step.replace(/^at (?:key|index) /, '').replace(/, $/, '')}`).join('')

for (const row of rows) {
  await test(`${row.name}: assert, refute and predicate agree on ${row.samples.length} samples`, () => {
    for (const sample of row.samples) {
      const label = `${row.name} on ${JSON.stringify(sample, (_, v: unknown) => typeof v === 'bigint' || typeof v === 'symbol' ? String(v) : v)}`
      const result = row.refute(sample)
      let thrown: undefined | A.AssertionError
      let returned: unknown
      try {
        returned = row.assert(sample)
      } catch (error) {
        assert.ok(error instanceof A.AssertionError, `${label}: assert threw a non-AssertionError`)
        thrown = error
      }
      assert.equal(!R.failed(result), thrown === undefined, `${label}: refute ${result.status} but assert ${thrown ? 'threw' : 'returned'}`)
      if (row.predicate) {
        assert.equal(row.predicate(sample), thrown === undefined, `${label}: predicate disagrees`)
      }
      if (R.failed(result) && thrown) {
        // Both packages name the same failing value and the same path. Deliberate wording differences, kept
        // for compatibility: refute puts a duplicate's index, an unexpected key and a failing record key
        // into words ("duplicate value at index 1", "has unexpected extra key b", "key, expected ...")
        // where assert puts them into the path (".1", ".b", ".a1").
        if (!/duplicate value|unexpected|^key, |, key, |strftime/.test(result.reason)) {
          assert.equal(refutePath(result.reason), assertPath(thrown), `${label}: paths differ (${result.reason} / ${thrown.message})`)
          assert.deepEqual(result.received, thrown.value, `${label}: received values differ`)
        }
      } else if (!R.failed(result)) {
        assert.equal(result.value, sample, `${label}: refute returns the input`)
        assert.equal(returned, sample, `${label}: assert returns the input`)
      }
    }
  })
}

await test('custom validators from one package compose into the containers of the same package', () => {
  const evenAssert: A.Assert<number> = value => {
    if (typeof value === 'number' && value % 2 === 0) return value
    throw new A.AssertionError({ expected: 'an even number', value })
  }
  assert.throws(() => A.object({ a: A.array(evenAssert) })({ a: [ 2, 3 ] }), /Expected \.a\.1 to be an even number, got 3\./)
  const evenRefute: R.Refute<number> = value => typeof value === 'number' && value % 2 === 0 ? R.ok(value) : R.fail(value, 'expected even number')
  assert.deepEqual(R.object({ a: R.array(evenRefute) })({ a: [ 2, 3 ] }), R.fail(3, 'at key a, at index 1, expected even number'))
  const evenPredicate = (value: unknown): value is number => typeof value === 'number' && value % 2 === 0
  assert.equal(P.object({ a: P.array(evenPredicate) })({ a: [ 2, 3 ] }), false)
  assert.equal(P.object({ a: P.array(evenPredicate) })({ a: [ 2, 4 ] }), true)
})

await test('every built-in carries its core validator, so no round trip through errors or strings happens when composing', async () => {
  const V = await import('@prelude/validation')
  for (const f of [ A.string, A.object({ a: A.string }), R.string, R.array(R.number), P.string, P.tuple(P.string) ]) {
    assert.equal(typeof V.unwrap(f), 'function')
  }
})
