import * as A from '@prelude/array'
import * as Q from './index.js'
import eventually from './eventually.js'
import sleep from './sleep.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const xs: number[] = []
  const f =
    (x: number) =>
      sleep(Math.random() * 100).then(() => { xs.push(x) })
  const q = Q.of(f)
  for (let i = 0; i < 100; i++) {
    void Q.push(q, i)
    await sleep(Math.random() * 10)
  }
  await eventually(async () => xs.length === 100)
  assert.deepEqual(xs, A.indices(100))
}, 10 * 1000)
