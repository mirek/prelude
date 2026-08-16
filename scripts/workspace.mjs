import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const packagesDirectory = path.join(root, 'packages')

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
]

// A directory left behind by a removed package holds only untracked output:
// its node_modules (pnpm does not delete it on install) and/or its mjs build.
// Ignore it rather than force every developer to clean it by hand after
// switching branches; anything tracked or unknown still counts as an orphan.
const leftoverEntries = new Set([ 'node_modules', 'mjs' ])

function isLeftover(directory) {
  const entries = readdirSync(directory)
  return entries.length > 0 && entries.every(name => leftoverEntries.has(name))
}

/**
 * Every directory under packages/, sorted. Throws when a directory has no
 * package.json: pnpm, the build, typecheck and pack scripts all discover
 * packages by manifest, so a manifest-less directory would otherwise be
 * silently excluded from every verification step.
 */
export function packageDirectories(parent = packagesDirectory) {
  const directories = readdirSync(parent, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(parent, entry.name))
    .filter(directory => existsSync(path.join(directory, 'package.json')) || !isLeftover(directory))
    .sort()
  const orphans = directories.filter(directory => !existsSync(path.join(directory, 'package.json')))
  if (orphans.length > 0) {
    throw new Error(
      `Directories under packages/ without a package.json are not workspace packages and are skipped by every check; add a manifest or remove them:\n${
        orphans.map(directory => `- ${path.relative(path.dirname(parent), directory)}`).join('\n')
      }`
    )
  }
  return directories
}

/** Every workspace package with its parsed manifest. */
export function readPackages() {
  return packageDirectories()
    .map(directory => ({
      directory,
      manifest: JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
    }))
}

/** Names of workspace packages this manifest depends on. */
export function workspaceDependencies(manifest, names) {
  const result = new Set()
  for (const field of dependencyFields) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (names.has(name) && typeof version === 'string' && version.startsWith('workspace:')) {
        result.add(name)
      }
    }
  }
  return result
}

/**
 * Orders packages so every workspace dependency comes before its dependents.
 * Ties keep the alphabetical order of `readPackages`. Throws on cycles.
 */
export function sortByDependencies(packages) {
  const byName = new Map(packages.map(pkg => [pkg.manifest.name, pkg]))
  const names = new Set(byName.keys())
  const state = new Map()
  const ordered = []

  function visit(pkg, trail) {
    const name = pkg.manifest.name
    const seen = state.get(name)
    if (seen === 'done') {
      return
    }
    if (seen === 'active') {
      throw new Error(`Workspace dependency cycle: ${[...trail, name].join(' -> ')}`)
    }
    state.set(name, 'active')
    for (const dependency of [...workspaceDependencies(pkg.manifest, names)].sort()) {
      visit(byName.get(dependency), [...trail, name])
    }
    state.set(name, 'done')
    ordered.push(pkg)
  }

  for (const pkg of packages) {
    visit(pkg, [])
  }
  return ordered
}
