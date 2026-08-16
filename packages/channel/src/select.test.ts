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

await test('a losing write attempt on an unbuffered channel is cancelled cleanly', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<number>()
  const selection = Ch.selectNext(a, b.writeAttempt(99, value => ({ done: false, value: `wrote:${value}` })))
  await a.write(1)
  assert.deepEqual(await selection, { done: false, value: 1 })
  assert.equal(b.pendingWrites, 0, 'the losing write is removed')
  assert.equal(a.pendingReads, 0)
})

await test('a write attempt wins asynchronously once a reader arrives', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<number>()
  const selection = Ch.selectNext(a, b.writeAttempt(7, value => ({ done: false, value: `wrote:${value}` })))
  assert.equal(await b.read(), 7)
  assert.deepEqual(await selection, { done: false, value: 'wrote:7' })
  assert.equal(a.pendingReads, 0)
})

await test('a write attempt on a buffered channel with a pending reader delivers directly', async () => {
  const ch = Ch.of<number>(1)
  const read = ch.next()
  assert.deepEqual(
    await Ch.selectNext(ch.writeAttempt(7, value => ({ done: false, value }))),
    { done: false, value: 7 }
  )
  assert.deepEqual(await read, { done: false, value: 7 })
  assert.equal(ch.pendingWrites, 0)
})

await test('a write attempt on a closed channel rejects like write()', async () => {
  const ch = Ch.of<number>(1)
  ch.closeWriting()
  await assert.rejects(Ch.selectNext(ch.writeAttempt(1, value => ({ done: false, value }))), /Channel closed/)
  assert.equal(ch.pendingWrites, 0)
})

await test('a write attempt that wins asynchronously on a bounded channel keeps its value buffered', async () => {
  const ch = Ch.of<number>(1)
  await ch.write(1)
  const selection = Ch.selectNext(ch.writeAttempt(2, value => ({ done: false, value: `wrote:${value}` })))
  assert.equal(await ch.read(), 1)
  assert.deepEqual(await selection, { done: false, value: 'wrote:2' })
  assert.equal(ch.pendingWrites, 1, 'the accepted write stays in the buffer')
  assert.deepEqual(await ch.next(), { done: false, value: 2 })
})

await test('select rejects when a selected channel has failed', async () => {
  const failed = Ch.of<number>()
  const idle = Ch.of<number>()
  failed.fail(new Error('boom'))
  await assert.rejects(Ch.selectNext(failed, idle), /boom/)
  await assert.rejects(Ch.selectNext(failed.readAttempt(result => result)), /boom/)
  assert.equal(idle.pendingReads, 0)

  const late = Ch.of<number>()
  const pending = Ch.selectNext(late, idle)
  late.fail(new Error('later'))
  await assert.rejects(pending, /later/)
  assert.equal(idle.pendingReads, 0, 'the losing read is undone')

  const lateRead = Ch.of<number>()
  const pendingRead = Ch.selectNext(lateRead.readAttempt(result => result), idle)
  lateRead.fail(new Error('later read'))
  await assert.rejects(pendingRead, /later read/)
})

await test('a pending write attempt rejects when the channel fails with a falsy reason', async () => {
  for (const reason of [ undefined, null, false, 0 ]) {
    const ch = Ch.of<number>()
    const pending = Ch.selectNext(ch.writeAttempt(1, value => ({ done: false, value })))
    ch.fail(reason)
    await assert.rejects(pending, err => err === reason, `fail(${String(reason)})`)
  }
  const ch = Ch.of<number>()
  const pending = Ch.selectNext(ch.writeAttempt(1, value => ({ done: false, value })))
  ch.fail(new Error('real'))
  await assert.rejects(pending, /real/)
})
