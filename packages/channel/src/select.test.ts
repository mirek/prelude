import { spawn } from './test.js'
import * as Ch from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<string>()
  a.writeIgnore(1)
  b.writeIgnore('2')
  const g = Ch.select(a, b)
  const c = await g.next()
  const d = await g.next()
  if (c.value === 1) {
    assert.deepEqual(d.value, '2')
  } else {
    assert.deepEqual(d.value, 1)
  }
})

await test('select drains both channels and settles every worker', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<string>()
  const results: Array<number | string> = []

  const workers = spawn(3, async () => {
    for await (const value of Ch.select(a, b)) {
      results.push(value)
    }
  })

  const writes: Promise<void>[] = []
  for (let index = 0; index < 100; index += 1) {
    writes.push(index % 2 === 0 ? a.write(index) : b.write(String(index)))
  }
  await Promise.all(writes)

  a.closeWriting()
  b.closeWriting()

  const settlements = await workers
  assert.ok(settlements.every(result => result.status === 'fulfilled'))
  assert.equal(a.pendingReads, 0)
  assert.equal(a.pendingWrites, 0)
  assert.equal(b.pendingReads, 0)
  assert.equal(b.pendingWrites, 0)
  assert.deepEqual(
    results.map(String).toSorted((left, right) => Number(left) - Number(right)),
    Array.from({ length: 100 }, (_, index) => String(index))
  )
})

await test('select completes at once when a channel is already done', async () => {
  const done = Ch.of<number>()
  const idle = Ch.of<string>()
  done.closeWriting()
  assert.deepEqual(await Ch.selectNext(done, idle), { done: true, value: undefined })
  assert.equal(idle.pendingReads, 0, 'no read is left registered on the other channel')
  assert.deepEqual(
    await Ch.selectNext(done.readAttempt(result => ({ done: result.done, value: `read:${String(result.done)}` }))),
    { done: true, value: 'read:true' }
  )
})
