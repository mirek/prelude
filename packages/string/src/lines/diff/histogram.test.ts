import histogram from './histogram.js'
import myers from './myers.js'
import * as Op from './op.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function t(A: string[], B: string[]) {
  const diff = histogram(A, B)
  Op.verify(A, B, diff)
  return Op.readable(diff)
}

await test('unique lines that swapped places produce a valid diff', () => {
  assert.deepEqual(t([ 'a', 'b' ], [ 'b', 'a' ]), [ '- a', '  b', '+ a' ])
  assert.deepEqual(t([ 'a', 'b', 'c' ], [ 'c', 'b', 'a' ]), [ '- a', '- b', '  c', '+ b', '+ a' ])
})

await test('anchored segments match myers where anchors are monotone', () => {
  const A = [ 'a', 'b', 'c', 'd', 'e' ]
  const B = [ 'a', 'x', 'c', 'y', 'e' ]
  assert.deepEqual(t(A, B), Op.readable(myers(A, B)))
  assert.deepEqual(t([], []), [])
  assert.deepEqual(t([ 'a' ], []), [ '- a' ])
  assert.deepEqual(t([], [ 'a' ]), [ '+ a' ])
  assert.deepEqual(t([ 'a', 'a' ], [ 'a' ]), [ '  a', '- a' ])
})

await test('every generated pair verifies', () => {
  // Deterministic LCG over a small alphabet exercises crossing anchors thoroughly.
  let seed = 42
  const random = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed % n
  }
  const alphabet = [ 'a', 'b', 'c', 'd', 'e' ]
  for (let trial = 0; trial < 2000; trial++) {
    const A = Array.from({ length: random(7) }, () => alphabet[random(alphabet.length)])
    const B = Array.from({ length: random(7) }, () => alphabet[random(alphabet.length)])
    const diff = histogram(A, B)
    assert.doesNotThrow(() => Op.verify(A, B, diff), `trial ${trial}: ${JSON.stringify([ A, B ])}`)
  }
})
