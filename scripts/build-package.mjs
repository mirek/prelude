import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { readPackages, workspaceDependencies } from './workspace.mjs'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')

function runTypeScript(args, cwd) {
  const result = spawnSync(process.execPath, [tsc, ...args], {
    cwd,
    stdio: 'inherit'
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const error = new Error(`tsc ${args.join(' ')} failed with status ${result.status}`)
    error.status = result.status ?? 1
    throw error
  }
}

/** Directories built during this process; their output is known to be current. */
const built = new Set()

function newestModification(directory) {
  let newest = 0
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestModification(target))
    } else if (/\.[cm]?ts$/.test(entry.name) && !/\.test\.[cm]?ts$/.test(entry.name)) {
      newest = Math.max(newest, statSync(target).mtimeMs)
    }
  }
  return newest
}

/** `true` if the package's declarations exist and are newer than every source file. */
function isFresh(directory) {
  const declarations = path.join(directory, 'mjs', 'index.d.ts')
  if (!existsSync(declarations)) {
    return false
  }
  return statSync(declarations).mtimeMs >= newestModification(path.join(directory, 'src'))
}

/**
 * Emit resolves workspace dependencies through their built declarations, so
 * they must exist first. The root build and pack-check order packages
 * themselves; a standalone `prepack` (plain `pnpm pack` in a clean checkout)
 * does not, so build whatever dependency is missing or stale, recursively.
 */
function buildDependencies(directory) {
  const packages = readPackages()
  const byName = new Map(packages.map(pkg => [pkg.manifest.name, pkg]))
  const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
  for (const name of workspaceDependencies(manifest, new Set(byName.keys()))) {
    const dependency = byName.get(name).directory
    if (
      dependency === directory ||
      built.has(dependency) ||
      !existsSync(path.join(dependency, 'tsconfig.lib.json')) ||
      isFresh(dependency)
    ) {
      continue
    }
    console.log(`build ${path.basename(dependency)} (dependency of ${path.basename(directory)})`)
    buildPackage(dependency)
  }
}

export function buildPackage(directory = process.cwd()) {
  const config = path.join(directory, 'tsconfig.lib.json')
  const source = path.join(directory, 'src')
  const output = path.join(directory, 'mjs')

  if (!existsSync(config)) {
    throw new Error(`Missing ${path.relative(process.cwd(), config)}`)
  }

  buildDependencies(directory)

  // The workspace tsconfig maps sibling packages to their sources so a clean
  // checkout type-checks. Emitting through that mapping would also emit the
  // siblings' sources — outside this package's rootDir, straight into their
  // src/ directories. Emit therefore resolves siblings the way consumers do:
  // through node_modules and their built declarations. Build in dependency
  // order (see scripts/workspace.mjs) so those declarations exist.
  // The config lives next to the real one so `types` and module lookups
  // resolve from the package directory; it is removed once emit finishes.
  const emitConfig = path.join(directory, 'tsconfig.emit.json')
  writeFileSync(emitConfig, `${JSON.stringify({
    extends: './tsconfig.lib.json',
    compilerOptions: { paths: {} }
  }, null, 2)}\n`)

  try {
    rmSync(output, { force: true, recursive: true })
    runTypeScript([
      '--project', emitConfig,
      '--declaration',
      '--sourceMap',
      '--outDir', output,
      '--rootDir', source
    ], directory)
  } finally {
    rmSync(emitConfig, { force: true })
  }
  built.add(directory)
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (invokedPath === import.meta.url) {
  try {
    buildPackage(process.cwd())
  } catch (error) {
    if (typeof error?.status !== 'number') {
      throw error
    }
    process.exitCode = error.status
  }
}
