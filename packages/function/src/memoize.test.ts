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
