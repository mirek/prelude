import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('timeout', async () => {

  assert.equal(await F.timeout(0.1 * 1000, () => F.sleep(1000).then(() => true), F.noop), undefined)

  await assert.rejects(F.timeout(0.1 * 1000, () => F.sleep(1000).then(() => true), () => { throw new Error('Timeout.') }), /Timeout\./)

})

await test('special timeout', async () => {

  await assert.rejects(F.timeout(
      0.1 * 1000,
      () => F.sleep(0.2 * 1000).then(() => true),
      () => F.sleep(0.3 * 1000).then(() => { throw Error('Actually reject.') })
    ), /Actually reject\./)

})

await test('a synchronously throwing f rejects without firing g later', async () => {
  let fired = false
  await assert.rejects(F.timeout(20, () => { throw new Error('sync') }, () => { fired = true }), /sync/)
  await F.sleep(40)
  assert.equal(fired, false)
})
