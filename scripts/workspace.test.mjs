import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { packageDirectories, readPackages } from './workspace.mjs'

function withPackages(layout, run) {
  const parent = mkdtempSync(path.join(tmpdir(), 'prelude-workspace-'))
  try {
    for (const [name, manifest] of Object.entries(layout)) {
      mkdirSync(path.join(parent, name, 'src'), { recursive: true })
      if (manifest !== null) {
        writeFileSync(path.join(parent, name, 'package.json'), JSON.stringify(manifest))
      }
    }
    writeFileSync(path.join(parent, 'not-a-directory.md'), '')
    return run(parent)
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}

test('packageDirectories lists every package directory, sorted', () => {
  withPackages({ b: { name: 'b' }, a: { name: 'a' } }, parent => {
    assert.deepEqual(packageDirectories(parent), [path.join(parent, 'a'), path.join(parent, 'b')])
  })
})

test('packageDirectories rejects a directory without a manifest instead of skipping it', () => {
  withPackages({ array: { name: 'array' }, graph: null, sketch: null }, parent => {
    assert.throws(
      () => packageDirectories(parent),
      error => error.message.includes(`- ${path.join(path.basename(parent), 'graph')}`)
        && error.message.includes(`- ${path.join(path.basename(parent), 'sketch')}`)
        && !error.message.includes('array')
    )
  })
})

test('packageDirectories ignores a removed package that only left node_modules behind', () => {
  withPackages({ array: { name: 'array' }, gone: null }, parent => {
    rmSync(path.join(parent, 'gone', 'src'), { recursive: true })
    mkdirSync(path.join(parent, 'gone', 'node_modules', '.pnpm'), { recursive: true })
    assert.deepEqual(packageDirectories(parent), [path.join(parent, 'array')])
  })
})

test('readPackages resolves against the real workspace', () => {
  const names = readPackages().map(pkg => pkg.manifest.name)
  assert.ok(names.includes('@prelude/tsconfig'))
  assert.equal(new Set(names).size, names.length)
})
