import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('on conflict throws', () => {
  assert.throws(() => G.pipe(
    [ 1, 2, 2, 3 ],
    G.record(String)
  ), /duplicate key 2/)
})

await test('on conflict first wins', () => {
  assert.deepEqual(G.pipe(
    [ 1, 21, 22, 3 ],
    G.record(_ => String(_)[0], G.record.firstWins)
  ), {
    '1': 1,
    '2': 21,
    '3': 3
  })
})

await test('on conflict last wins', () => {
  assert.deepEqual(G.pipe(
    [ 1, 21, 22, 3 ],
    G.record(_ => String(_)[0], G.record.lastWins)
  ), {
    '1': 1,
    '2': 22,
    '3': 3
  })
})

await test('keys named after Object.prototype members are recorded like any other', () => {
  assert.deepEqual(G.record((x: string) => x)([ 'hasOwnProperty', 'a' ]), { hasOwnProperty: 'hasOwnProperty', a: 'a' })
  assert.deepEqual(G.record((x: string) => x)([ 'constructor', 'toString' ]), { constructor: 'constructor', toString: 'toString' })
  assert.throws(() => G.record((x: string) => x)([ 'hasOwnProperty', 'hasOwnProperty' ]), /duplicate key hasOwnProperty/)
  assert.deepEqual(G.record((x: string) => x, G.record.lastWins)([ 'valueOf', 'valueOf' ]), { valueOf: 'valueOf' })
})

await test('a __proto__ key is an own property, not the prototype', () => {
  const result = G.record((x: string) => x)([ '__proto__', 'a' ])
  assert.deepEqual(Object.keys(result).toSorted(), [ '__proto__', 'a' ])
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
  assert.throws(() => G.record((x: string) => x)([ '__proto__', '__proto__' ]), /duplicate key __proto__/)
  const last = G.record((x: string) => x, G.record.lastWins)([ '__proto__', '__proto__' ])
  assert.deepEqual(Object.keys(last), [ '__proto__' ])
})
