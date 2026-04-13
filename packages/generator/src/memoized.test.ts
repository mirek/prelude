import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('memoized', () => {

  const generated: number[] = []

  const g =
    function* () {
      for (let i = 0; i < 10; i++) {
        generated.push(i)
        yield i
      }
    }

  const g_ = G.memoized(g())

  const expected = G.array(G.range(0, 9))
  assert.deepEqual(G.array(g_()), expected)
  assert.deepEqual(G.array(g_()), expected)
  assert.deepEqual(generated, expected)
})
