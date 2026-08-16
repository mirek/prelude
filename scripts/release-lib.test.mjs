import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readPlans } from './release-lib.mjs'

function withPlansDirectory(run) {
  const directory = mkdtempSync(path.join(tmpdir(), 'release-plans-'))
  try {
    return run(directory)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('readPlans keeps plan file paths inside the plans directory', () => {
  withPlansDirectory(directory => {
    writeFileSync(path.join(directory, 'a.json'), JSON.stringify({
      summary: 'Ship it',
      packages: { '@mirek/array': 'patch' },
      file: 'elsewhere.json',
      filePath: '/elsewhere/package.json'
    }))

    const [plan] = readPlans(directory)
    assert.equal(plan.file, 'a.json')
    assert.equal(plan.filePath, path.join(directory, 'a.json'))
    assert.deepEqual(plan, {
      file: 'a.json',
      filePath: path.join(directory, 'a.json'),
      summary: 'Ship it',
      packages: { '@mirek/array': 'patch' }
    })
  })
})

test('readPlans returns an empty list for a missing directory', () => {
  withPlansDirectory(directory => {
    assert.deepEqual(readPlans(path.join(directory, 'missing')), [])
  })
})

test('readPlans rejects plans without a summary or a packages object', () => {
  withPlansDirectory(directory => {
    writeFileSync(path.join(directory, 'a.json'), JSON.stringify({ packages: {} }))
    assert.throws(() => readPlans(directory), /a\.json must contain a non-empty summary/)
  })
  withPlansDirectory(directory => {
    writeFileSync(path.join(directory, 'a.json'), JSON.stringify({ summary: 'x', packages: [] }))
    assert.throws(() => readPlans(directory), /a\.json must contain a packages object/)
  })
})

test('readPlans ignores non-json files and sorts plans by name', () => {
  withPlansDirectory(directory => {
    mkdirSync(path.join(directory, 'nested'))
    writeFileSync(path.join(directory, 'b.json'), JSON.stringify({ summary: 'b', packages: {} }))
    writeFileSync(path.join(directory, 'a.json'), JSON.stringify({ summary: 'a', packages: {} }))
    writeFileSync(path.join(directory, 'notes.md'), 'ignored')
    assert.deepEqual(readPlans(directory).map(plan => plan.file), ['a.json', 'b.json'])
  })
})
