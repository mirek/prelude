import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('throttle', async () => {
  const xs: number[] = []
  const push = () => {
    xs.push(Math.random())
  }
  const push_ = F.throttle(1000, push)
  const id = setInterval(() => {
    push_()
  }, 100)
  await F.sleep(3.5 * 1000)
  clearInterval(id)
  assert.equal(xs.length, 4)
  await F.sleep(1000)
  assert.equal(xs.length, 5)
})
