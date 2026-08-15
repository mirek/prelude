import * as F from './index.js'
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
