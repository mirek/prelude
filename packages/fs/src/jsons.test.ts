import * as Fs from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

/** Runs `f` with a fresh temporary directory that is removed afterwards. */
const withDir = async (f: (dir: string) => Promise<void> | void) => {
  const dir = Fs.mkdtempSync(`${Fs.Os.tmpdir()}${Fs.Path.sep}`)
  try {
    await f(dir)
  } finally {
    Fs.rmSync(dir, { recursive: true, force: true })
  }
}

const records = [ { a: 1 }, { b: 2 }, { c: 3 } ]

await test('writeJsonsSync round-trips every record through readJsonsSync and readJsons', () => withDir(async dir => {
  const path = Fs.Path.join(dir, 'sync.jsonl')
  Fs.writeJsonsSync(path, records)
  assert.equal(Fs.readStringSync(path), '{"a":1}\n{"b":2}\n{"c":3}\n')
  assert.deepEqual(Fs.readJsonsSync(path), records)
  assert.deepEqual(await Fs.readJsons(path), records)
}))

await test('writeJsons round-trips and matches the sync writer', () => withDir(async dir => {
  const path = Fs.Path.join(dir, 'async.jsonl')
  await Fs.writeJsons(path, records)
  assert.equal(Fs.readStringSync(path), '{"a":1}\n{"b":2}\n{"c":3}\n')
  assert.deepEqual(await Fs.readJsons(path), records)
}))

await test('readers accept a final record without a trailing newline and empty files', () => withDir(async dir => {
  const path = Fs.Path.join(dir, 'tail.jsonl')
  Fs.writeStringSync(path, '{"a":1}\n{"b":2}')
  assert.deepEqual(Fs.readJsonsSync(path), [ { a: 1 }, { b: 2 } ])
  assert.deepEqual(await Fs.readJsons(path), [ { a: 1 }, { b: 2 } ])
  const empty = Fs.Path.join(dir, 'empty.jsonl')
  Fs.writeStringSync(empty, '')
  assert.deepEqual(Fs.readJsonsSync(empty), [])
  assert.deepEqual(await Fs.readJsons(empty), [])
}))

await test('readers skip blank lines and CRLF endings between records', () => withDir(async dir => {
  const path = Fs.Path.join(dir, 'blank.jsonl')
  Fs.writeStringSync(path, '{"a":1}\n\n{"b":2}\r\n   \n{"c":3}\n')
  assert.deepEqual(Fs.readJsonsSync(path), records)
  assert.deepEqual(await Fs.readJsons(path), records)
}))

await test('writers refuse values JSON cannot represent instead of writing the text undefined', () => withDir(async dir => {
  const path = Fs.Path.join(dir, 'bad.json')
  assert.throws(() => Fs.writeJsonSync(path, undefined), TypeError)
  assert.throws(() => Fs.writeJsonSync(path, () => 1), TypeError)
  await assert.rejects(Fs.writeJson(path, undefined), TypeError)
  assert.throws(() => Fs.writeJsonsSync(path, [ { a: 1 }, undefined ]), TypeError)
  await assert.rejects(Fs.writeJsons(path, [ undefined ]), TypeError)
  assert.equal(Fs.existsSync(path), false)
}))
