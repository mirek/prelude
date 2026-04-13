import * as Fs from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('missing', async () => {
  assert.equal(await Fs.missing('foo'), true)
  assert.equal(await Fs.missing('package.json'), false)
})
