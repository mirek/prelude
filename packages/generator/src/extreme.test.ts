import * as G from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('extreme', () => {
  const values = [ 6, 3, 1, 8, 2, 4, 5, 7 ]
  const f = (a: number, b: number) => a - b
  assert.deepEqual(G.pipe(
    values,
    G.extreme(f)
  ), {
    min: values.slice().sort(f)[0],
    max: values.slice().sort(f).reverse()[0]
  })
})

await test('does not close an exhausted source and keeps the comparator error when return() throws', () => {
  const tracked = () => {
    const tracker = {
      returnCalls: 0,
      [Symbol.iterator](): Iterator<number> {
        const iterator = [ 3, 1, 2 ][Symbol.iterator]()
        return {
          next: () => iterator.next(),
          return: () => {
            tracker.returnCalls++
            throw new Error('return boom')
          }
        }
      }
    }
    return tracker
  }
  const full = tracked()
  assert.deepEqual(G.extreme((a: number, b: number) => a - b)(full), { min: 1, max: 3 })
  assert.equal(full.returnCalls, 0)
  const failing = tracked()
  assert.throws(() => G.extreme(() => { throw new Error('cmp boom') })(failing), /cmp boom/)
  assert.equal(failing.returnCalls, 1)
})
