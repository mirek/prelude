import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

class Api {
  @$.rpc($.tuple($.number, $.number))
  add(a: number, b: number): number {
    return a + b
  }
}

const api = new Api

const call =
  (target: unknown, method: string, ...params: unknown[]): unknown =>
    typeof target === 'object' && target !== null && method in target ?
      target[method](...params) :
      undefined

await test('rpc', () => {
  assert.deepEqual(call(api, 'add', 1, 2), 3)
  assert.throws(() => call(api, 'add', '1', '2'), /Invalid argument\(s\)\./)
})
