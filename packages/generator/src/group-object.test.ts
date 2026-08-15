import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('groupObject', () => {
  assert.deepEqual(G.pipe(G.range(1, 10), G.groupObject(_ => _ % 2 === 0 ? 'even' : 'odd')), {
    even: [ 2, 4, 6, 8, 10 ],
    odd: [ 1, 3, 5, 7, 9 ]
  })
})

await test('keys named after Object.prototype members are grouped like any other', () => {
  const grouped = G.groupObject((x: string) => x)([ 'constructor', 'toString', 'constructor', 'a' ])
  assert.deepEqual(grouped, { constructor: [ 'constructor', 'constructor' ], toString: [ 'toString' ], a: [ 'a' ] })
})

await test('a __proto__ key is grouped as an own property', () => {
  const grouped = G.groupObject((x: string) => x)([ '__proto__', '__proto__', 'b' ])
  assert.deepEqual(Object.keys(grouped).toSorted(), [ '__proto__', 'b' ])
  assert.equal(Object.getPrototypeOf(grouped), Object.prototype)
  assert.deepEqual(Object.getOwnPropertyDescriptor(grouped, '__proto__')?.value, [ '__proto__', '__proto__' ])
})
