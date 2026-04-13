import * as G from './index.js'
import sleep from './sleep.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('map', async () => {
  const result = await G.pipe(
    G.ofIterable([ 1, 2, 3 ]),
    G.map(x => String(x * 2)),
    G.array
  )
  for (const v of [ '2', '4', '6' ]) {
    assert.ok(result.includes(v))
  }
})

await test('concurrent map', async () => {
  assert.deepEqual(await G.pipe(
    G.range(1, 9),
    G.map(async value => {
      await sleep(10)
      return String(value * 2)
    }, { concurrency: 3 }),
    G.array
  ), [ '2', '4', '6', '8', '10', '12', '14', '16', '18' ])
})
