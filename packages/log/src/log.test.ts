import * as Log from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', () => {
  const target = new Log.Target.Memory()
  const log = Log.of('test', {
    level: 'info',
    target,
  })
  log.info('hello')
  log.debug('bye')
  assert.equal(target.length, 1)
  assert.deepEqual(target.last, [ 'info', 'test: [info]', 'hello' ])
})

await test('error', () => {
  const target = new Log.Target.Memory()
  const log = Log.of('test', {
    level: 'info',
    target,
  })
  log.error('hello', new Error('world'))
  assert.equal(target.length, 1)
  const last = target.last as unknown[]
  assert.equal(last[0], 'error')
  assert.equal(last[1], 'test: [error]')
  assert.equal(last[2], 'hello')
  assert.ok(typeof last[3] === 'string' && last[3].includes('world'))
})

await test('circular and bigint entries are logged instead of throwing', () => {
  const target = new Log.Target.Memory()
  const log = Log.of('test', { level: 'info', target })
  const circular: { a: number, self?: unknown, list?: unknown[] } = { a: 1 }
  circular.self = circular
  circular.list = [ circular, { a: 1 } ]
  log.info('x', circular)
  assert.deepEqual(target.last, [ 'info', 'test: [info]', 'x', '{"a":1,"self":"[Circular]","list":["[Circular]",{"a":1}]}' ])
  log.info('y', { n: 10n }, 5n)
  assert.deepEqual(target.last, [ 'info', 'test: [info]', 'y', '{"n":"10n"}', '5n' ])
  const shared = { v: 1 }
  log.info('z', { a: shared, b: shared })
  assert.deepEqual(target.last, [ 'info', 'test: [info]', 'z', '{"a":{"v":1},"b":{"v":1}}' ])
})
