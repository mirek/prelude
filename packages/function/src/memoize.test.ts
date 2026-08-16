import * as F from './index.js'
import { key } from './memoize.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const factorial =
  F.memoize((n: number): bigint =>
    n === 1 ?
      1n :
      BigInt(n) * factorial(n - 1)
  )

await test('memoize', () => {
  const expected = 93326215443944152681699238856266700490715968264381621468592963895217599993229915608941463976156518286253697920827223758251185210916864000000000000000000000000n
  assert.equal(factorial(100), expected)
  assert.equal(factorial.cache.size, 100)
  assert.equal(factorial.cache.get('[100]'), expected)
  assert.equal(factorial.cache.get('[1]'), 1n)
  assert.equal(factorial.cache.get('[50]'), 30414093201713378043612608166064768844377641568960512000000000000n)
})

await test('default key distinguishes values JSON collapses to null', () => {
  let calls = 0
  const f = F.memoize((x: unknown) => {
    calls++
    return String(x)
  })
  const g = () => 1
  const h = () => 1
  assert.equal(f(null), 'null')
  assert.equal(f(undefined), 'undefined')
  assert.equal(f(NaN), 'NaN')
  assert.equal(f(Infinity), 'Infinity')
  assert.equal(f(-Infinity), '-Infinity')
  assert.equal(f(1n), '1')
  assert.equal(f(1), '1')
  assert.equal(f(g), String(g))
  assert.equal(f(h), String(h))
  assert.equal(f(Symbol('s')), 'Symbol(s)')
  assert.equal(calls, 10)
  // Repeats hit the cache.
  f(undefined)
  f(NaN)
  f(g)
  assert.equal(calls, 10)
  // Ordinary JSON-safe arguments keep the plain JSON key.
  assert.equal(f.cache.has('[1]'), true)
  assert.equal(f.cache.has('[null]'), true)
})

await test('default key keeps NUL-prefixed strings apart from tagged values', () => {
  const nul = String.fromCharCode(0)
  assert.notEqual(key([undefined]), key([`${nul}undefined`]))
  assert.notEqual(key([NaN]), key([`${nul}NaN`]))
  assert.notEqual(key([1n]), key([`${nul}1n`]))
  assert.notEqual(key([`${nul}undefined`]), key([`${nul}${nul}undefined`]))
  let calls = 0
  const f = F.memoize((x: unknown) => {
    calls++
    return String(x)
  })
  assert.equal(f(undefined), 'undefined')
  assert.equal(f(`${nul}undefined`), `${nul}undefined`)
  assert.equal(calls, 2)
  // Ordinary strings keep the plain JSON key.
  assert.equal(key(['a', '']), '["a",""]')
  assert.equal(key([`a${nul}`]), JSON.stringify([`a${nul}`]))
  // Boxed strings are unwrapped before escaping, so they cannot spell out an escaped or tagged key.
  assert.equal(key([new String(`${nul}x`)]), key([`${nul}x`]))
  assert.notEqual(key([`${nul}x`]), key([new String(`${nul}:${nul}x`)]))
  assert.notEqual(key([undefined]), key([new String(`${nul}undefined`)]))
})
