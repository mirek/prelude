import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('sleep resolves after the delay', async () => {
  const start = Date.now()
  await F.sleep(20)
  assert.ok(Date.now() - start >= 15)
})

await test('aborting sleep rejects with the reason and clears the timer', async () => {
  const controller = new AbortController()
  const start = Date.now()
  const pending = F.sleep(1000, { signal: controller.signal })
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.ok(Date.now() - start < 500, 'rejects without waiting for the timer')
})

await test('an already aborted signal rejects sleep immediately with the default AbortError', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(F.sleep(1000, { signal: controller.signal }), (error: unknown) => error instanceof DOMException && error.name === 'AbortError')
})

await test('a settled sleep ignores a later abort', async () => {
  const controller = new AbortController()
  await F.sleep(1, { signal: controller.signal })
  controller.abort()
})
