import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { assertTagsMatchHead, provenanceArgs, publishPrepared, readPlans } from './release-lib.mjs'

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

const head = 'a'.repeat(40)
const other = 'b'.repeat(40)
const prepared = {
  schemaVersion: 1,
  packages: [
    { name: '@mirek/array', version: '1.0.1', tag: '@mirek/array@1.0.1' },
    { name: '@mirek/map', version: '2.0.0', tag: '@mirek/map@2.0.0' }
  ]
}

test('assertTagsMatchHead throws when a remote tag points at another commit', () => {
  const remote = new Map([['@mirek/map@2.0.0', other]])
  assert.throws(
    () => assertTagsMatchHead(prepared, head, tag => remote.get(tag)),
    { message: `Remote tag @mirek/map@2.0.0 points at ${other}, expected ${head}` }
  )
})

test('assertTagsMatchHead returns the remote commit for every prepared tag', () => {
  const remote = new Map([['@mirek/array@1.0.1', head]])
  const commits = assertTagsMatchHead(prepared, head, tag => remote.get(tag))
  assert.deepEqual([...commits], [
    ['@mirek/array@1.0.1', head],
    ['@mirek/map@2.0.0', undefined]
  ])
})

test('publishPrepared validates every tag before publishing anything', () => {
  const remote = new Map([['@mirek/map@2.0.0', other]])
  const published = []
  const packages = new Map(prepared.packages.map(item => [item.name, {
    directory: `/packages/${item.name}`,
    manifest: { name: item.name, version: item.version }
  }]))
  assert.throws(() => publishPrepared({
    prepared,
    packages,
    head,
    remoteTagCommit: tag => remote.get(tag),
    isPublished: () => false,
    publish: entry => published.push(entry.manifest.name),
    log: () => {}
  }), /Remote tag @mirek\/map@2\.0\.0 points at/)
  assert.deepEqual(published, [])
})

test('publishPrepared publishes unpublished packages and returns the remote tag commits', () => {
  const remote = new Map([['@mirek/array@1.0.1', head]])
  const published = []
  const packages = new Map(prepared.packages.map(item => [item.name, {
    directory: `/packages/${item.name}`,
    manifest: { name: item.name, version: item.version }
  }]))
  const commits = publishPrepared({
    prepared,
    packages,
    head,
    remoteTagCommit: tag => remote.get(tag),
    isPublished: name => name === '@mirek/array',
    publish: entry => published.push(entry.manifest.name),
    log: () => {}
  })
  assert.deepEqual(published, ['@mirek/map'])
  assert.deepEqual([...commits], [
    ['@mirek/array@1.0.1', head],
    ['@mirek/map@2.0.0', undefined]
  ])
})

test('provenance is requested only on GitHub Actions unless overridden', () => {
  assert.deepEqual(provenanceArgs({}), [])
  assert.deepEqual(provenanceArgs({ GITHUB_ACTIONS: 'true' }), ['--provenance'])
  assert.deepEqual(provenanceArgs({ GITHUB_ACTIONS: 'true', RELEASE_PROVENANCE: '0' }), [])
  assert.deepEqual(provenanceArgs({ RELEASE_PROVENANCE: '1' }), ['--provenance'])
  assert.deepEqual(provenanceArgs({ RELEASE_PROVENANCE: 'false' }), [])
})
