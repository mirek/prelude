import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('maybePairwise', () => {
  const xs = [ 1, 2, 3 ]
  const cmp = Cmp.maybePairwise(Cmp.number)
  assert.equal(cmp(xs, [ 1, 2, 3 ]), Cmp.eq)
  assert.equal(cmp(xs, [ 1, 2, 4 ]), Cmp.asc)
  assert.equal(cmp(xs, [ 1, 2, 2 ]), Cmp.dsc)
  assert.equal(cmp(xs, [ 1, 2, 3, 4 ]), Cmp.asc)
  assert.equal(cmp(xs, [ 1, 2 ]), Cmp.dsc)
})

await test('maybePairwise closes only unexhausted iterators and keeps an in-flight error', () => {
  const tracked = (values: number[], throwOnReturn = false) => {
    const tracker = {
      returnCalls: 0,
      [Symbol.iterator](): Iterator<number> {
        const iterator = values[Symbol.iterator]()
        return {
          next: () => iterator.next(),
          return: () => {
            tracker.returnCalls++
            if (throwOnReturn) {
              throw new Error('return boom')
            }
            return { done: true, value: undefined }
          }
        }
      }
    }
    return tracker
  }
  const cmp = Cmp.maybePairwise(Cmp.number)
  const a = tracked([ 1, 2 ])
  const b = tracked([ 1, 2 ])
  assert.equal(cmp(a, b), Cmp.eq)
  assert.equal(a.returnCalls, 0)
  assert.equal(b.returnCalls, 0)
  const short = tracked([ 1 ])
  const long = tracked([ 1, 2 ])
  assert.equal(cmp(short, long), Cmp.asc)
  assert.equal(short.returnCalls, 0)
  assert.equal(long.returnCalls, 1)
  const x = tracked([ 1, 2 ])
  const y = tracked([ 2, 2 ])
  assert.equal(cmp(x, y), Cmp.asc)
  assert.equal(x.returnCalls, 1)
  assert.equal(y.returnCalls, 1)
  assert.equal(cmp(tracked([ 1 ], true), tracked([ 1 ], true)), Cmp.eq)
  assert.throws(() => Cmp.maybePairwise(() => { throw new Error('cmp boom') })(tracked([ 1 ], true), tracked([ 1 ], true)), /cmp boom/)
})
