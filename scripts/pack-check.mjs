import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readPackages, sortByDependencies } from './workspace.mjs'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')
const root = fileURLToPath(new URL('..', import.meta.url))
const packages = path.join(root, 'packages')
const rootManifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const pnpmCli = process.env.npm_execpath

if (!pnpmCli) {
  throw new Error('pack-check must be run through pnpm')
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`)
  }

  return result
}

function runPnpm(args, cwd) {
  return run(process.execPath, [pnpmCli, ...args], { cwd })
}

function collectTargets(value, targets = []) {
  if (typeof value === 'string') {
    if (value.startsWith('./')) {
      targets.push(value.slice(2))
    }
    return targets
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTargets(item, targets)
    }
    return targets
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      collectTargets(item, targets)
    }
  }

  return targets
}

function wildcardRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('*', '[^/]+')}$`)
}

function parsePackReport(stdout, packageName) {
  let data
  try {
    data = JSON.parse(stdout)
  } catch {
    throw new Error(`pnpm pack returned invalid JSON for ${packageName}:\n${stdout}`)
  }

  const report = Array.isArray(data) ? data[0] : data
  if (!report || !Array.isArray(report.files)) {
    throw new Error(`pnpm pack did not report files for ${packageName}`)
  }

  return report
}

function packedFiles(report) {
  return new Set(report.files.map(file => {
    const packedPath = typeof file === 'string' ? file : file.path
    return packedPath.replace(/^package\//, '')
  }))
}

function resolveTarball(report, tarballDirectory) {
  const reported = report.filename ?? report.path ?? report.tarball
  const candidates = [
    typeof reported === 'string' ? path.resolve(reported) : undefined,
    typeof reported === 'string' ? path.join(tarballDirectory, path.basename(reported)) : undefined
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  const tarballs = readdirSync(tarballDirectory)
    .filter(file => file.endsWith('.tgz'))
    .map(file => path.join(tarballDirectory, file))

  if (tarballs.length === 1) {
    return tarballs[0]
  }

  throw new Error(`Could not identify packed tarball from ${JSON.stringify(report)}`)
}

function readTarEntry(tarball, entry) {
  return run('tar', ['-xOf', tarball, entry]).stdout
}

function validateTargets(packageName, manifest, files) {
  const targets = [
    ...collectTargets(manifest.main),
    ...collectTargets(manifest.module),
    ...collectTargets(manifest.types),
    ...collectTargets(manifest.typings),
    ...collectTargets(manifest.bin),
    ...collectTargets(manifest.exports)
  ]

  for (const target of new Set(targets)) {
    if (target.includes('*')) {
      const pattern = wildcardRegex(target)
      if (![...files].some(file => pattern.test(file))) {
        throw new Error(`${packageName} packs no file matching ${target}`)
      }
      continue
    }

    if (!files.has(target)) {
      throw new Error(`${packageName} does not pack exported file ${target}`)
    }
  }
}

function validateDependencies(packageName, manifest) {
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies'
  ]) {
    for (const [dependency, version] of Object.entries(manifest[field] ?? {})) {
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        throw new Error(`${packageName} retains ${field}.${dependency}=${version} in its tarball`)
      }
    }
  }
}

function validateContents(packageName, files) {
  const forbidden = [...files].filter(file =>
    file.startsWith('src/') ||
    file.startsWith('test/') ||
    /(^|\/)Makefile$/.test(file) ||
    /(^|\/)tsconfig(?:\.[^/]*)?\.json$/.test(file) ||
    /(^|\/)(?:AGENTS|CLAUDE)\.md$/.test(file) ||
    /\.(?:test|bench)\.[cm]?[jt]sx?$/.test(file)
  )

  if (forbidden.length > 0) {
    throw new Error(`${packageName} packs development-only files:\n${forbidden.join('\n')}`)
  }
}

function findSubpath(packageName, manifest, files) {
  if (!manifest.exports?.['./*.js']) {
    return undefined
  }

  const file = [...files]
    .filter(candidate => candidate.startsWith('mjs/'))
    .filter(candidate => candidate.endsWith('.js'))
    .filter(candidate => candidate !== 'mjs/index.js')
    .sort()[0]

  return file ? `${packageName}/${file.slice('mjs/'.length)}` : undefined
}

// Dependency order: `prepack` builds each package against its siblings' built
// declarations, so dependencies must be packed (and therefore built) first.
const packageDirectories = sortByDependencies(readPackages())
  .filter(({ directory, manifest }) =>
    manifest.private !== true && (
      existsSync(path.join(directory, 'tsconfig.lib.json')) ||
      manifest.name === '@prelude/tsconfig'
    ))
  .map(({ directory }) => directory)

if (packageDirectories.length === 0) {
  throw new Error('No publishable packages found')
}

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'prelude-pack-check-'))
const tarballDirectory = path.join(temporaryDirectory, 'tarballs')
const fixtureDirectory = path.join(temporaryDirectory, 'consumer')

try {
  const packagesByName = new Map()

  for (const directory of packageDirectories) {
    const sourceManifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
    console.log(`pack-check ${sourceManifest.name}`)

    const packageTarballDirectory = path.join(tarballDirectory, path.basename(directory))
    const result = runPnpm([
      'pack',
      '--pack-destination', packageTarballDirectory,
      '--json'
    ], directory)

    const report = parsePackReport(result.stdout, sourceManifest.name)
    const files = packedFiles(report)
    const tarball = resolveTarball(report, packageTarballDirectory)
    const packedManifest = JSON.parse(readTarEntry(tarball, 'package/package.json'))

    validateTargets(sourceManifest.name, packedManifest, files)
    validateDependencies(sourceManifest.name, packedManifest)
    validateContents(sourceManifest.name, files)

    packagesByName.set(sourceManifest.name, {
      files,
      manifest: packedManifest,
      subpath: findSubpath(sourceManifest.name, packedManifest, files),
      tarball
    })
  }

  const dependencies = Object.fromEntries(
    [...packagesByName.entries()].map(([name, data]) => [
      name,
      `file:${path.relative(fixtureDirectory, data.tarball)}`
    ])
  )

  const fixtureManifest = {
    name: 'prelude-package-consumer',
    private: true,
    type: 'module',
    dependencies,
    devDependencies: {
      '@types/node': rootManifest.devDependencies['@types/node']
    }
  }

  writeFileSync(
    path.join(temporaryDirectory, 'fixture-package.json'),
    `${JSON.stringify(fixtureManifest, null, 2)}\n`
  )
  run('mkdir', ['-p', fixtureDirectory])
  writeFileSync(
    path.join(fixtureDirectory, 'package.json'),
    readFileSync(path.join(temporaryDirectory, 'fixture-package.json'))
  )

  runPnpm(['install', '--ignore-scripts', '--no-frozen-lockfile'], fixtureDirectory)

  const runtimeSpecifiers = [...packagesByName.entries()]
    .filter(([name]) => name !== '@prelude/tsconfig')
    .flatMap(([name, data]) => [name, data.subpath].filter(Boolean))

  writeFileSync(
    path.join(fixtureDirectory, 'runtime.mjs'),
    `for (const specifier of ${JSON.stringify(runtimeSpecifiers, null, 2)}) {\n  await import(specifier)\n}\n`
  )
  run(process.execPath, ['runtime.mjs'], { cwd: fixtureDirectory })

  const typeImports = runtimeSpecifiers
    .map((specifier, index) => `import type * as Package${index} from '${specifier}'`)
    .join('\n')
  writeFileSync(path.join(fixtureDirectory, 'imports.ts'), `${typeImports}\n`)
  writeFileSync(path.join(fixtureDirectory, 'tsconfig.json'), `${JSON.stringify({
    extends: '@prelude/tsconfig/backend.json',
    compilerOptions: {
      noEmit: true,
      noUnusedLocals: false,
      noUnusedParameters: false
    },
    include: ['imports.ts']
  }, null, 2)}\n`)
  run(process.execPath, [tsc, '--project', 'tsconfig.json'], { cwd: fixtureDirectory })
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true })
}
