import WaitGroup from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('wait resolves at zero and the group can be reused', async () => {
  const group = new WaitGroup(2)
  const first = group.wait()
  const second = group.wait()

  group.done()
  assert.equal(await Promise.race([
    first.then(() => 'resolved'),
    Promise.resolve('pending')
  ]), 'pending')

  group.done()
  await Promise.all([ first, second ])
  await group.wait()

  group.add(2)
  const reused = group.wait()
  group.done(2)
  await reused
  await group.wait()
})

await test('counter underflow rejects existing and future waiters', async () => {
  const group = new WaitGroup(1)
  const waiting = group.wait()
  let failure: unknown

  assert.throws(() => group.done(2), error => {
    failure = error
    return error instanceof RangeError && error.message === 'WaitGroup counter underflow.'
  })

  await assert.rejects(waiting, error => error === failure)
  await assert.rejects(group.wait(), error => error === failure)
  assert.throws(() => group.add(), error => error === failure)
  assert.throws(() => group.done(), error => error === failure)
})

await test('counter overflow rejects waiters and becomes terminal', async () => {
  const group = new WaitGroup(Number.MAX_SAFE_INTEGER)
  const waiting = group.wait()
  let failure: unknown

  assert.throws(() => group.add(), error => {
    failure = error
    return error instanceof RangeError && error.message === 'WaitGroup counter overflow.'
  })

  await assert.rejects(waiting, error => error === failure)
  await assert.rejects(group.wait(), error => error === failure)
})

await test('explicit rejection settles every waiter and preserves the first error', async () => {
  const group = new WaitGroup(1)
  const reason = new Error('cancelled')
  const first = group.wait()
  const second = group.wait()

  group.reject(reason)
  group.reject(new Error('ignored'))

  await assert.rejects(first, error => error === reason)
  await assert.rejects(second, error => error === reason)
  await assert.rejects(group.wait(), error => error === reason)
  assert.throws(() => group.add(), error => error === reason)
  assert.throws(() => group.done(), error => error === reason)
})

await test('constructor validates the initial counter', () => {
  for (const counter of [ -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY ]) {
    assert.throws(
      () => new WaitGroup(counter),
      new RangeError('counter must be a non-negative safe integer.')
    )
  }
})

await test('invalid deltas are rejected without changing a healthy group', async () => {
  const group = new WaitGroup(1)

  for (const delta of [ -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY ]) {
    assert.throws(
      () => group.add(delta),
      new RangeError('delta must be a non-negative safe integer.')
    )
    assert.throws(
      () => group.done(delta),
      new RangeError('delta must be a non-negative safe integer.')
    )
  }

  const waiting = group.wait()
  group.add(0)
  group.done(0)
  group.done()
  await waiting
})
