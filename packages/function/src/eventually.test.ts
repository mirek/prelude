import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('eventually does not sleep after the final attempt and rejects with an error', async () => {
  const start = Date.now()
  await assert.rejects(
    F.eventually(async () => false, { retry: n => n < 1, delay: 500 }),
    (err: unknown) => err instanceof Error && /attempt/.test(err.message)
  )
  assert.ok(Date.now() - start < 400, 'no trailing delay')
  const custom = await F.eventually(async () => false, { retry: n => n < 2, delay: 1, reject: () => 'fallback' })
  assert.equal(custom, 'fallback')
})

await test('eventually retries until the predicate holds', async () => {
  let calls = 0
  assert.equal(await F.eventually(async () => ++calls >= 3, { retry: n => n < 5, delay: 1 }), true)
  assert.equal(calls, 3)
})

await test('eventually evaluates a stateful retry predicate once per candidate attempt', async () => {
  let remaining = 3
  let retries = 0
  let calls = 0
  await assert.rejects(
    F.eventually(async () => { calls++; return false }, { retry: () => { retries++; return remaining-- > 0 }, delay: 1 }),
    (err: unknown) => err instanceof Error && /within 3 attempt/.test(err.message)
  )
  assert.equal(calls, 3, 'f runs once per allowed attempt')
  assert.equal(retries, 4, 'retry is asked once per candidate attempt, including the refused one')
})

await test('eventually does not overshoot a duration-based retry predicate by the delay', async () => {
  let calls = 0
  const durations: number[] = []
  await assert.rejects(
    F.eventually(async () => { calls++; return false }, {
      retry: (_n, duration) => { durations.push(duration); return duration < 25 },
      delay: 50
    }),
    (err: unknown) => err instanceof Error && /within 1 attempt/.test(err.message)
  )
  assert.equal(calls, 1, 'the second attempt would start after ~50ms, past the 25ms budget')
  assert.ok(durations[1] >= 50, 'the predicate sees the time at which the attempt would start')
})

await test('aborting eventually cuts the delay short, stops retrying and rejects with the reason', async () => {
  const controller = new AbortController()
  let calls = 0
  const start = Date.now()
  const pending = F.eventually(async () => { calls++; return false }, { retry: n => n < 10, delay: 1000, signal: controller.signal })
  await new Promise(resolve => setTimeout(resolve, 10))
  controller.abort(new Error('stop'))
  await assert.rejects(pending, /stop/)
  assert.ok(Date.now() - start < 500, 'no full delay')
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(calls, 1, 'no further attempt')
})

await test('an already aborted signal makes eventually reject before the first attempt', async () => {
  const controller = new AbortController()
  controller.abort(new Error('never'))
  let calls = 0
  await assert.rejects(F.eventually(async () => { calls++; return true }, { signal: controller.signal }), /never/)
  assert.equal(calls, 0)
})

await test('an abort during an attempt rejects once the attempt settles, without another attempt', async () => {
  const controller = new AbortController()
  let calls = 0
  const pending = F.eventually(async () => {
    calls++
    controller.abort(new Error('stop'))
    return false
  }, { retry: n => n < 5, delay: 1, signal: controller.signal })
  await assert.rejects(pending, /stop/)
  assert.equal(calls, 1)
})
