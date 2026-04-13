import * as RemoteClock from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const t =
  (value: string) =>
    RemoteClock.nextMidSecondOffset(RemoteClock.of(), new Date(value).getTime())

await test('simple', () => {
  assert.deepEqual(t('2000-01-01T00:00:00.000Z'), 500)
  assert.deepEqual(t('2000-01-01T00:00:00.250Z'), 250)
  assert.deepEqual(t('2000-01-01T00:00:00.500Z'), 1000)
  assert.deepEqual(t('2000-01-01T00:00:00.750Z'), 750)
  assert.deepEqual(t('2000-01-01T00:00:00.123Z'), 500 - 123)
})
