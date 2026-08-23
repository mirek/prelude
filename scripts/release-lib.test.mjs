import assert from 'node:assert/strict'
import { test } from 'node:test'

import { orderPackages, planPublish, provenanceArgs, runPublish } from './release-lib.mjs'

const head = 'a'.repeat(40)
const other = 'b'.repeat(40)

function workspace(manifests) {
  return new Map(manifests.map(manifest => [manifest.name, {
    directory: `/packages/${manifest.name}`,
    manifest
  }]))
}

const packages = workspace([
  { name: '@mirek/set', version: '2.0.0', dependencies: { '@mirek/array': 'workspace:*' } },
  { name: '@mirek/array', version: '1.0.1', dependencies: { '@mirek/cmp': 'workspace:*' } },
  { name: '@mirek/cmp', version: '5.0.0' },
  { name: '@mirek/eq', version: '1.0.0', peerDependencies: { '@mirek/cmp': 'workspace:*' } }
])

test('orderPackages publishes workspace dependencies before their dependents', () => {
  assert.deepEqual(orderPackages(packages), ['@mirek/cmp', '@mirek/array', '@mirek/eq', '@mirek/set'])
})

test('orderPackages still orders cyclic workspace dependencies', () => {
  const cyclic = workspace([
    { name: '@mirek/a', version: '1.0.0', dependencies: { '@mirek/b': 'workspace:*' } },
    { name: '@mirek/b', version: '1.0.0', dependencies: { '@mirek/a': 'workspace:*' } }
  ])
  assert.deepEqual(orderPackages(cyclic), ['@mirek/a', '@mirek/b'])
})

test('planPublish publishes unpublished versions and tags missing tags only', () => {
  const remote = new Map([['@mirek/cmp@5.0.0', other]])
  const published = new Set(['@mirek/cmp@5.0.0', '@mirek/array@1.0.1'])
  const plan = planPublish({
    packages,
    head,
    remoteTagCommit: tag => remote.get(tag),
    isPublished: (name, version) => published.has(`${name}@${version}`)
  })
  assert.deepEqual(plan.map(({ directory, ...item }) => item), [
    { name: '@mirek/cmp', version: '5.0.0', tag: '@mirek/cmp@5.0.0', publish: false, createTag: false },
    { name: '@mirek/array', version: '1.0.1', tag: '@mirek/array@1.0.1', publish: false, createTag: true },
    { name: '@mirek/eq', version: '1.0.0', tag: '@mirek/eq@1.0.0', publish: true, createTag: true },
    { name: '@mirek/set', version: '2.0.0', tag: '@mirek/set@2.0.0', publish: true, createTag: true }
  ])
})

test('planPublish rejects an unpublished version whose tag points at another commit', () => {
  const remote = new Map([['@mirek/set@2.0.0', other]])
  assert.throws(
    () => planPublish({ packages, head, remoteTagCommit: tag => remote.get(tag), isPublished: () => false }),
    { message: `Remote tag @mirek/set@2.0.0 points at ${other}, expected ${head}` }
  )
})

test('planPublish accepts an unpublished version whose tag already points at head', () => {
  const remote = new Map([['@mirek/cmp@5.0.0', head]])
  const plan = planPublish({ packages, head, remoteTagCommit: tag => remote.get(tag), isPublished: () => false })
  assert.deepEqual(plan.find(item => item.name === '@mirek/cmp'), {
    name: '@mirek/cmp',
    version: '5.0.0',
    tag: '@mirek/cmp@5.0.0',
    directory: '/packages/@mirek/cmp',
    publish: true,
    createTag: false
  })
})

test('runPublish publishes everything before tagging anything and reports the count', () => {
  const plan = [
    { tag: 'a@1', publish: false, createTag: false },
    { tag: 'b@1', publish: false, createTag: true },
    { tag: 'c@1', publish: true, createTag: true }
  ]
  const events = []
  const count = runPublish(plan, {
    publish: item => events.push(`publish ${item.tag}`),
    tag: item => events.push(`tag ${item.tag}`),
    log: () => {}
  })
  assert.equal(count, 1)
  assert.deepEqual(events, ['publish c@1', 'tag b@1', 'tag c@1'])
})

test('provenance is requested only on GitHub Actions unless overridden', () => {
  assert.deepEqual(provenanceArgs({}), [])
  assert.deepEqual(provenanceArgs({ GITHUB_ACTIONS: 'true' }), ['--provenance'])
  assert.deepEqual(provenanceArgs({ GITHUB_ACTIONS: 'true', RELEASE_PROVENANCE: '0' }), ['--no-provenance'])
  assert.deepEqual(provenanceArgs({ RELEASE_PROVENANCE: '1' }), ['--provenance'])
  assert.deepEqual(provenanceArgs({ RELEASE_PROVENANCE: 'false' }), ['--no-provenance'])
})
