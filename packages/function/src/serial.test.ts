import * as A from '@prelude/array'
import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('serial', async () => {
  const xs: number[] = []

  const f =
    (x: number) =>
      F.sleep(Math.random() * 100).then(() => { xs.push(x) })

  const g = F.serial(f)

  for (let i = 0; i < 100; i++) {
    void g(i)
    await F.sleep(Math.random() * 10)
  }

  await F.eventually(async () => xs.length === 100)

  assert.deepEqual(xs, A.indices(100))
}, 10 * 1000)
