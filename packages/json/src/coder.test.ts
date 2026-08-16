import * as Json from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const custom = Json.of({
  ...Json.global,
  legacyDecoder: true
})
Json.register(custom, Json.Codecs.Undefined)
Json.register(custom, Json.Codecs.Number)

const t =
  (value: unknown) =>
    assert.deepEqual(custom.parse(custom.stringify(value)), value)

await test('basic', () => {
  t(1)
  t('foo')
  t(true)
  t(false)
  t(null)
  t([])
  t({})
  t([ 1, 'foo', true, false, null, [], {} ])
})

await test('non json serializable', () => {
  t(new Date())
  t(new Error('foo'))
  t(/foo/)
  t(new Set([ 1, 2, 3 ]))
  t(new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ]))
  t(new Set([ new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ]) ]))
  t(new Map([ [ 'foo', new Set([ 1, 2, 3 ]) ] ]))
  t(new Uint8Array([ 1, 2, 3 ]))
  t([ undefined, null, NaN, Infinity, -Infinity, -0, 0 ])
})

await test('bigint round-trips through the global coder', () => {
  assert.equal(Json.parse(Json.stringify(1n)), 1n)
  assert.deepEqual(Json.parse(Json.stringify({ a: 123456789012345678901234567890n })), { a: 123456789012345678901234567890n })
  assert.deepEqual(Json.parse(Json.stringify([ -1n, 0n ])), [ -1n, 0n ])
})

await test('built-in error subclasses round-trip through the global coder', () => {
  for (const Ctor of [ EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError ]) {
    const decoded = Json.parse(Json.stringify(new Ctor('boom'))) as Error
    assert.ok(decoded instanceof Ctor, `${Ctor.name} instance`)
    assert.equal(decoded.message, 'boom')
    assert.equal(decoded.name, Ctor.name)
  }
  const aggregate = Json.parse(Json.stringify(new AggregateError([ new TypeError('inner') ], 'agg'))) as AggregateError
  assert.ok(aggregate instanceof AggregateError)
  assert.equal(aggregate.message, 'agg')
  assert.ok(aggregate.errors[0] instanceof TypeError)
  assert.equal((aggregate.errors[0] as Error).message, 'inner')
})

await test('error cause is encoded and decoded recursively', () => {
  const decoded = Json.parse(Json.stringify(new Error('outer', { cause: new RangeError('inner') }))) as Error
  assert.ok(decoded.cause instanceof RangeError)
  assert.equal((decoded.cause as Error).message, 'inner')
  const withBigint = Json.parse(Json.stringify(new Error('a', { cause: 1n }))) as Error
  assert.equal(withBigint.cause, 1n)
  const withMap = Json.parse(Json.stringify(new Error('a', { cause: new Map([ [ 'k', new Date(0) ] ]) }))) as Error
  assert.deepEqual(withMap.cause, new Map([ [ 'k', new Date(0) ] ]))
  const withoutCause = Json.parse(Json.stringify(new Error('plain'))) as Error
  assert.equal('cause' in withoutCause, false)
})

await test('large Uint8Array values are encoded without overflowing the stack', () => {
  const bytes = new Uint8Array(200_000)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = i % 256
  }
  assert.deepEqual(Json.parse(Json.stringify(bytes)), bytes)
  assert.deepEqual(Json.parse(Json.stringify(new Uint8Array(0))), new Uint8Array(0))
})

await test('map keys keep their types while string-keyed maps keep the object encoding', () => {
  const map = new Map<unknown, unknown>([ [ 1, 'a' ], [ { x: 1 }, new Set([ 2 ]) ], [ new Date(0), 3n ] ])
  assert.deepEqual(Json.parse(Json.stringify(map)), map)
  assert.equal(Json.stringify(new Map([ [ 'k', 'v' ] ])), '{"^Map$":{"k":"v"}}')
  assert.equal(Json.stringify(new Map<unknown, string>([ [ 'k', 'v' ], [ 1, 'w' ] ])), '{"^Map$":[["k","v"],[1,"w"]]}')
  assert.deepEqual(Json.parse('{"^Map$":{"foo":"bar","n":{"^Set$":[1]}}}'), new Map<string, unknown>([ [ 'foo', 'bar' ], [ 'n', new Set([ 1 ]) ] ]))
  assert.deepEqual(Json.parse(Json.stringify(new Map([ [ 1, 'a' ] ]))), new Map([ [ 1, 'a' ] ]))
})

await test('invalid dates round-trip', () => {
  const decoded = Json.parse(Json.stringify({ d: new Date(NaN) })) as { d: Date }
  assert.ok(decoded.d instanceof Date)
  assert.ok(Number.isNaN(decoded.d.getTime()))
  assert.deepEqual(Json.parse(Json.stringify(new Date(0))), new Date(0))
})

await test('empty and tag-like keys are ordinary data', () => {
  assert.deepEqual(Json.parse(Json.stringify({ '': 1 })), { '': 1 })
  assert.deepEqual(Json.parse(Json.stringify(new Map([ [ '', 1 ] ]))), new Map([ [ '', 1 ] ]))
  assert.deepEqual(Json.parse(Json.stringify(new Map([ [ '^Set$', [ 1 ] ] ]))), new Map([ [ '^Set$', [ 1 ] ] ]))
  assert.deepEqual(Json.parse(Json.stringify(new Map([ [ '^Date$', 'x' ] ]))), new Map([ [ '^Date$', 'x' ] ]))
  // A plain object cannot carry such keys on the wire without being misread; refuse it at encode time.
  assert.throws(() => Json.stringify({ 'a^Foo$': 1 }), /reserved for encoded values/)
  assert.throws(() => Json.stringify({ nested: { '^Date$': 'x' } }), /reserved for encoded values/)
  assert.deepEqual(Json.parse(Json.stringify({ 'a$': 1, '^b': 2, 'c^d': 3 })), { 'a$': 1, '^b': 2, 'c^d': 3 })
})

await test('null-prototype objects are encoded like plain objects', () => {
  const input = Object.create(null) as { d: Date, s: Set<number> }
  input.d = new Date(0)
  input.s = new Set([ 1 ])
  assert.deepEqual(Json.parse(Json.stringify(input)), { d: new Date(0), s: new Set([ 1 ]) })
})

await test('only own enumerable properties are encoded, like JSON.stringify', () => {
  // An inherited tag-like key is not on the wire, so it must not be refused.
  assert.equal(Json.stringify(Object.assign(Object.create({ '^Date$': 1 }), { safe: 1 })), '{"safe":1}')
  // An inherited encodable value must not leak into the output as an own key.
  assert.equal(Json.stringify(Object.assign(Object.create({ when: new Date(0) }), { safe: 1 })), '{"safe":1}')
  // An enumerable tag-like key on Object.prototype must not break ordinary encodes or decodes.
  Object.defineProperty(Object.prototype, '^Date$', { value: 'x', enumerable: true, configurable: true })
  try {
    assert.equal(Json.stringify({ safe: 1 }), '{"safe":1}')
    assert.deepEqual(Json.parse('{"safe":1}'), { safe: 1 })
    assert.deepEqual(Json.parse('{"d":{"^Date$":"1970-01-01T00:00:00.000Z"}}'), { d: new Date(0) })
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete Object.prototype['^Date$']
  }
})

await test('circular structures are reported as TypeError instead of overflowing the stack', () => {
  const circular: { a: number, self?: unknown } = { a: 1 }
  circular.self = circular
  assert.throws(() => Json.stringify(circular), TypeError)
  const array: unknown[] = [ 1 ]
  array.push(array)
  assert.throws(() => Json.stringify({ array }), TypeError)
  const shared = { d: new Date(0) }
  assert.deepEqual(Json.parse(Json.stringify([ shared, shared ])), [ shared, shared ], 'shared references are fine')
})
