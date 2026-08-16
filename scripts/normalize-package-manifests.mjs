import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { packageDirectories, root } from './workspace.mjs'

const write = process.argv.includes('--write')

const files = [
  'mjs',
  'Readme.md',
  'README.md',
  'License.md',
  'LICENSE'
]

const workspaceExtends = new Map([
  ['@prelude/tsconfig/isomorphic.json', '@prelude/tsconfig/workspace-isomorphic.json'],
  ['@prelude/tsconfig/backend.json', '@prelude/tsconfig/workspace-backend.json'],
  ['@prelude/tsconfig/test.json', '@prelude/tsconfig/workspace-test.json']
])

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

// Public configs ship in the tarball. Workspace configs add the
// `@prelude/* -> ../*/src/index.ts` alias and must stay repository-only, but
// TypeScript resolves tsconfig `extends` through package.json `exports`, so
// they still have to be exported for sibling packages to extend them from
// source. `publishConfig.exports` narrows the map back down at pack time.
const publicTsconfigExports = {
  './base.json': './base.json',
  './isomorphic.json': './isomorphic.json',
  './isomorphic.d.ts': './isomorphic.d.ts',
  './backend.json': './backend.json',
  './javascript-backend.json': './javascript-backend.json',
  './test.json': './test.json',
  './package.json': './package.json'
}

const workspaceTsconfigExports = {
  './workspace-isomorphic.json': './workspace-isomorphic.json',
  './workspace-backend.json': './workspace-backend.json',
  './workspace-test.json': './workspace-test.json'
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
      ...publicTsconfigExports,
      ...workspaceTsconfigExports
    },
    publishConfig: {
      ...manifest.publishConfig,
      exports: publicTsconfigExports
    }
  }
}

function normalizeProject(project) {
  const normalized = {
    ...project,
    extends: workspaceExtends.get(project.extends) ?? project.extends
  }

  const paths = normalized.compilerOptions?.paths
  if (JSON.stringify(paths) === JSON.stringify({ '@prelude/*': ['../*/src/index.ts'] })) {
    const compilerOptions = { ...normalized.compilerOptions }
    delete compilerOptions.paths
    if (Object.keys(compilerOptions).length === 0) {
      delete normalized.compilerOptions
    } else {
      normalized.compilerOptions = compilerOptions
    }
  }

  return normalized
}

function updateJson(filePath, normalize, changed) {
  const original = readFileSync(filePath, 'utf8')
  const content = `${JSON.stringify(normalize(JSON.parse(original)), null, 2)}\n`
  if (content === original) {
    return
  }

  changed.push(path.relative(root, filePath))
  if (write) {
    writeFileSync(filePath, content)
  }
}

const changed = []
for (const directory of packageDirectories()) {
  const manifestPath = path.join(directory, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  if (manifest.name === '@prelude/tsconfig') {
    updateJson(manifestPath, normalizeTsconfigManifest, changed)
  } else if (existsSync(path.join(directory, 'tsconfig.lib.json')) && manifest.private !== true) {
    updateJson(manifestPath, normalizeLibraryManifest, changed)
  }

  for (const name of ['tsconfig.lib.json', 'tsconfig.test.json']) {
    const projectPath = path.join(directory, name)
    if (existsSync(projectPath)) {
      updateJson(projectPath, normalizeProject, changed)
    }
  }
}

if (changed.length > 0) {
  const message = `Package configuration needs normalization:\n${changed.map(file => `- ${file}`).join('\n')}`
  if (!write) {
    throw new Error(`${message}\nRun pnpm manifests:write.`)
  }
  console.log(message)
}
