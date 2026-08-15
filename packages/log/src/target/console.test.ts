import consoleTarget, { console_, console as namedConsole } from './console.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('default export is the console target, not the global console', () => {
  assert.equal(consoleTarget, console_)
  assert.equal(namedConsole, console_)
  assert.notEqual(consoleTarget, globalThis.console)
  assert.equal(typeof consoleTarget.fatal, 'function')
  assert.equal(Object.hasOwn(consoleTarget, 'fatal'), true)
  assert.equal('fatal' in globalThis.console, false)
})
