import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const packagesDirectory = path.join(root, 'packages')
const write = process.argv.includes('--write')

const files = [
  'mjs',
  'Readme.md',
  'README.md',
  'License.md',
  'LICENSE'
]

function declarationTarget(target) {
  return target.replace(/\.js$/, '.d.ts')
}

function normalizeExport(target) {
  if (typeof target === 'string') {
    return target.endsWith('.js') ? {
      types: declarationTarget(target),
      import: target
    } : target
  }

  if (!target || Array.isArray(target) || typeof target !== 'object') {
    return target
  }

  const importTarget = target.import
  if (typeof importTarget !== 'string' || !importTarget.endsWith('.js')) {
    return target
  }

  return {
    types: typeof target.types === 'string' ? target.types : declarationTarget(importTarget),
    ...target
  }
}

function normalizeLibraryManifest(manifest) {
  const scripts = {
    ...manifest.scripts,
    prepack: 'node ../../scripts/build-package.mjs'
  }

  const exports = manifest.exports && typeof manifest.exports === 'object'
    ? Object.fromEntries(Object.entries(manifest.exports).map(([key, value]) => [key, normalizeExport(value)]))
    : {
        '.': {
          types: './mjs/index.d.ts',
          import: './mjs/index.js'
        },
        './*.js': {
          types: './mjs/*.d.ts',
          import: './mjs/*.js'
        }
      }

  if (!exports['.']) {
    exports['.'] = {
      types: './mjs/index.d.ts',
      import: './mjs/index.js'
    }
  }

  return {
    ...manifest,
    files,
    scripts,
    types: './mjs/index.d.ts',
    exports
  }
}

function normalizeTsconfigManifest(manifest) {
  return {
    ...manifest,
    files: [
      'base.json',
      'isomorphic.json',
      'isomorphic.d.ts',
      'backend.json',
      'javascript-backend.json',
      'test.json'
    ],
    exports: {
      './base.json': './base.json',
      './isomorphic.json': './isomorphic.json',
      './isomorphic.d.ts': './isomorphic.d.ts',
      './backend.json': './backend.json',
      './javascript-backend.json': './javascript-backend.json',
      './test.json': './test.json',
      './package.json': './package.json'
    }
  }
}

const packageDirectories = readdirSync(packagesDirectory, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(packagesDirectory, entry.name))
  .filter(directory => existsSync(path.join(directory, 'package.json')))
  .sort()

const changed = []
for (const directory of packageDirectories) {
  const manifestPath = path.join(directory, 'package.json')
  const original = readFileSync(manifestPath, 'utf8')
  const manifest = JSON.parse(original)

  let normalized
  if (manifest.name === '@prelude/tsconfig') {
    normalized = normalizeTsconfigManifest(manifest)
  } else if (existsSync(path.join(directory, 'tsconfig.lib.json')) && manifest.private !== true) {
    normalized = normalizeLibraryManifest(manifest)
  } else {
    continue
  }

  const content = `${JSON.stringify(normalized, null, 2)}\n`
  if (content === original) {
    continue
  }

  changed.push(path.relative(root, manifestPath))
  if (write) {
    writeFileSync(manifestPath, content)
  }
}

if (changed.length > 0) {
  const message = `Package manifests need normalization:\n${changed.map(file => `- ${file}`).join('\n')}`
  if (!write) {
    throw new Error(`${message}\nRun pnpm manifests:write.`)
  }
  console.log(message)
}
