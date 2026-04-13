import * as Fs from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('missing', async () => {
  assert.equal(Fs.missingSync('foo'), true)
  assert.equal(Fs.missingSync('package.json'), false)
})
