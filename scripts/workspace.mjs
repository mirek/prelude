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

/** Every directory under packages/ that has a package.json, with its parsed manifest. */
export function readPackages() {
  return readdirSync(packagesDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(packagesDirectory, entry.name))
    .filter(directory => existsSync(path.join(directory, 'package.json')))
    .sort()
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
