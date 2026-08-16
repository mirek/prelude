import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { checkLinks, checkReadme, renderPackageIndex } from './check-docs.mjs'
import { root } from './workspace.mjs'

// A package directory with a License.md, so the template's link resolves.
const directory = mkdtempSync(path.join(tmpdir(), 'prelude-docs-pkg-'))
writeFileSync(path.join(directory, 'License.md'), '')
process.on('exit', () => rmSync(directory, { recursive: true, force: true }))
const name = '@prelude/foo'

const good = `# Foo module

Does foo.

# Usage

\`\`\`bash
npm i -E @prelude/foo
\`\`\`

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).
`

test('a README following the template passes', () => {
  assert.deepEqual(checkReadme(good, { name, directory }), [])
})

test('forbidden content is reported with its reason', () => {
  const text = good
    .replace('Does foo.', 'See /Users/someone/prelude and https://sonarcloud.io/x?id=preludejs_foo')
  const failures = checkReadme(text, { name, directory })
  assert.ok(failures.some(f => f.includes('machine-local path')), failures.join('\n'))
  assert.ok(failures.some(f => f.includes('SonarCloud')), failures.join('\n'))
  assert.ok(failures.some(f => f.includes('preludejs')), failures.join('\n'))
})

test('a README must mention the package, an install command and a CC0 license section', () => {
  const failures = checkReadme('# Foo\n\nHello.\n\n# License\n\n```\nMIT License\n```\n', { name, directory })
  assert.ok(failures.some(f => f.includes('never mentions @prelude/foo')))
  assert.ok(failures.some(f => f.includes('no install command')))
  assert.ok(failures.some(f => f.includes('MIT license text')))
  assert.ok(failures.some(f => f.includes('must point at ./License.md')))
  assert.ok(checkReadme('# Foo\n\nnpm i @prelude/foo\n', { name, directory }).some(f => f.includes('no License section')))
})

test('relative links must resolve, absolute and anchor links are ignored', () => {
  const parent = mkdtempSync(path.join(tmpdir(), 'prelude-docs-'))
  try {
    mkdirSync(path.join(parent, 'docs'))
    writeFileSync(path.join(parent, 'docs', 'guide.md'), '')
    const text = '[a](./docs/guide.md) [b](docs/guide.md#top) [c](https://example.com/x.md) [d](#anchor) [e](./missing.md)'
    assert.deepEqual(checkLinks(text, parent, 'pkg'), ['pkg: dead relative link ./missing.md'])
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
})

test('the package index is rendered sorted by directory with private packages marked', () => {
  const rendered = renderPackageIndex([
    { directory: path.join(root, 'packages', 'zeta'), manifest: { name: '@prelude/zeta', description: 'Zeta.' } },
    { directory: path.join(root, 'packages', 'alpha'), manifest: { name: '@prelude/alpha', description: 'Alpha.', private: true } }
  ])
  assert.equal(rendered, [
    '<!-- package-index:start -->',
    '| Directory | Package | Description |',
    '| --- | --- | --- |',
    '| `packages/alpha` | `@prelude/alpha` (private) | Alpha. |',
    '| `packages/zeta` | `@prelude/zeta` | Zeta. |',
    '<!-- package-index:end -->'
  ].join('\n'))
})
