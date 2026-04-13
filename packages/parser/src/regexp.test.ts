import * as P from './index.js'
import * as R from '@prelude/refute'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('comment', () => {
  const comment = P.re(/<!--(.*?)-->/, 1)
  assert.deepEqual(P.parse(comment, '<!--foo-->'), 'foo')
  assert.deepEqual(P.parse(P.star(P.or(P.ws1, comment)), ' <!--foo--> <!--bar--> '), [
    ' ',
    'foo',
    ' ',
    'bar',
    ' '
  ])
})

await test('digit', () => {
  const p = P.map(P.re(/\d/), _ => parseInt(_, 10))
  assert.deepEqual(P.parse(p, '1'), 1)
  assert.throws(() => P.parse(p, '123'), new RegExp(String.raw`Expected exhaustive result, parsed 1 \(unparsed 2\)\.\n\n123\n \^ 1:2`))
})

await test('convoluted date', () => {
  const digit0: P.t<number> =
    P.map(P.re(/\d/), _ => parseInt(_, 10))
  const dd2: P.t<number> =
    P.refute(P.map(P.seq(digit0, digit0), ([ a, b ]) => (a * 10) + b), R.between(1, 31))
  const mm: P.t<number> =
    P.refute(P.map(P.seq(digit0, digit0), ([ a, b ]) => (a * 10) + b - 1), R.between(0, 11))
  function chars2(chars_: string, min = 1, max = Infinity): P.t<string> {
    return function (reader) {
      let i = 0
      let char = P.Reader.peek(reader, i)
      while (char && chars_.includes(char) && i < max) {
        char = P.Reader.peek(reader, ++i)
      }
      return i >= min ?
        P.Result.eat(reader, i) :
        P.Result.fail(reader, `While char(s) ${chars_} failed for min ${min} (i ${i}).`)
    }
  }
  const intDigits =
    (minChars = 1, maxChars = minChars) =>
      P.map(chars2('0123456789', minChars, maxChars), _ => parseInt(_, 10))
  const yyyy: P.t<number> =
    intDigits(4)
  const p = P.seq(yyyy, mm, dd2)
  assert.deepEqual(digit0(P.Reader.of('0')), P.Result.ok(P.Reader.of('0', 1), 0))
  assert.deepEqual(digit0(P.Reader.of('1')), P.Result.ok(P.Reader.of('1', 1), 1))
  assert.deepEqual(digit0(P.Reader.of('12')), P.Result.ok(P.Reader.of('12', 1), 1))
  assert.deepEqual(P.parse(yyyy, '2021'), 2021)
  assert.deepEqual(P.parse(mm, '05'), 4)
  assert.deepEqual(P.parse(dd2, '01'), 1)
  assert.deepEqual(P.parse(p, '20210501'), [ 2021, 4, 1 ])
})
