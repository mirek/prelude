import * as Actor from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

type Counter =
  | { type: 'inc', value: number }
  | { type: 'dec', value: number }

await test('counter', async () => {
  const actor =
    Actor.of({ counter: 0 }, async (state, message: Counter) => {
      switch (message.type) {
        case 'inc':
          state.counter += message.value
          break
        case 'dec':
          state.counter -= message.value
          break
      }
    })

  void Actor.run(actor)

  await Actor.send(actor, { type: 'inc', value: 5 })
  await Actor.send(actor, { type: 'inc', value: 3 })
  await Actor.send(actor, { type: 'dec', value: 2 })

  await Actor.stop(actor)

  assert.equal(actor.state.counter, 6)
})

await test('messages are processed sequentially', async () => {
  const actor =
    Actor.of({ order: [] as number[] }, async (state, value: number) => {
      await new Promise(resolve => setTimeout(resolve, 10 - value))
      state.order.push(value)
    })

  void Actor.run(actor)

  for (let i = 0; i < 5; i++) {
    void Actor.send(actor, i)
  }

  await Actor.stop(actor)

  assert.deepEqual(actor.state.order, [ 0, 1, 2, 3, 4 ])
})

await test('stop is idempotent', async () => {
  const actor =
    Actor.of({}, async () => {})

  void Actor.run(actor)

  await Actor.stop(actor)
  await Actor.stop(actor)
})

await test('run is idempotent', async () => {
  const actor =
    Actor.of({ n: 0 }, async (state, message: number) => {
      state.n += message
    })

  const a = Actor.run(actor)
  const b = Actor.run(actor)
  assert.equal(a, b)

  await Actor.send(actor, 1)
  await Actor.stop(actor)
  assert.equal(actor.state.n, 1)
})
