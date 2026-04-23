import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('eq', () => {
  assert.equal($.eq('x')('x'), 'x')
  assert.throws(() => $.eq('x')('y'), /Expected 'x', got 'y'\./)
})

await test('is handles NaN', () => {
  assert.ok(Number.isNaN($.is(NaN)(NaN) as number))
  assert.throws(() => $.is(NaN)(1))
})

await test('oneOf', () => {
  const a = $.oneOf('a', 'b', 'c')
  assert.equal(a('b'), 'b')
  assert.throws(() => a('d'), /Expected one of 'a', 'b', 'c'/)
})

await test('instance', () => {
  class Foo {}
  class Bar {}
  const foo = new Foo()
  assert.equal($.instance(Foo)(foo), foo)
  assert.throws(() => $.instance(Foo)(new Bar()), /an instance of Foo/)
})

await test('predicate', () => {
  const is = $.predicate($.number)
  assert.equal(is(1), true)
  assert.equal(is('x'), false)
})

await test('between / gt / gte / lt / lte', () => {
  assert.equal($.between(0, 10)(5), 5)
  assert.throws(() => $.between(0, 10)(11))
  assert.equal($.gt(0)(1), 1)
  assert.throws(() => $.gt(0)(0))
  assert.equal($.gte(0)(0), 0)
  assert.equal($.lt(10)(1), 1)
  assert.throws(() => $.lt(10)(10))
  assert.equal($.lte(10)(10), 10)
})

await test('regexp', () => {
  assert.equal($.regexp(/^a/)('abc'), 'abc')
  assert.throws(() => $.regexp(/^a/)('x'), /matching \/\^a\//)
  assert.throws(() => $.regexp(/^a/)(1), /Expected a string/)
})

await test('unique', () => {
  const a = $.unique($.number)
  assert.deepEqual(a([1, 2, 3]), [1, 2, 3])
  assert.throws(() => a([1, 2, 1]), /Expected \.2 to be a unique value/)
})
