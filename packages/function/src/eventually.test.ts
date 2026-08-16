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
