import { sleep, spawn } from './test.js'
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

await test('select', async () => {
  const a = Ch.of<number>()
  const b = Ch.of<string>()
  const results: string[] = []

  void spawn(3, async worker => {
    for await (const value of Ch.select(a, b)) {
      results.push(`${worker} ${value}`)
      if (Math.random() > 0.5) {
        await sleep(Math.round(Math.random() * 10))
      }
    }
  })

  for (let i = 0; i < 100; i++) {
    if (Math.random() > 0.5) {
      a.writeIgnore(i)
    } else {
      b.writeIgnore(i.toString())
    }
  }

  await sleep(3 * 1000)

  assert.deepEqual(results.length, 100)

}, 10_000)
