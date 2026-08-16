import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const packagesDirectory = path.join(root, 'packages')
export const plansDirectory = path.join(root, '.release', 'plans')
export const preparedPath = path.join(root, '.release', 'prepared.json')

const bumpRank = new Map([
  ['patch', 1],
  ['minor', 2],
  ['major', 3]
])

const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies'
]

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) {
    throw new Error(`Release automation only supports stable x.y.z versions, got ${version}`)
  }
  return match.slice(1).map(Number)
}

function bumpVersion(version, bump) {
  const [major, minor, patch] = parseVersion(version)
  switch (bump) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
    default: throw new Error(`Unsupported bump ${bump}`)
  }
}

function highestBump(left, right) {
  return (bumpRank.get(left) ?? 0) >= (bumpRank.get(right) ?? 0) ? left : right
}

export function readPackages() {
  const packages = readdirSync(packagesDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(packagesDirectory, entry.name))
    .filter(directory => existsSync(path.join(directory, 'package.json')))
    .map(directory => ({
      directory,
      manifestPath: path.join(directory, 'package.json'),
      manifest: JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
    }))
    .filter(entry => entry.manifest.private !== true)

  return new Map(packages.map(entry => [entry.manifest.name, entry]))
}

export function readPlans(directory = plansDirectory) {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const filePath = path.join(directory, file)
      const plan = JSON.parse(readFileSync(filePath, 'utf8'))
      if (typeof plan.summary !== 'string' || plan.summary.trim() === '') {
        throw new Error(`${file} must contain a non-empty summary`)
      }
      if (!plan.packages || typeof plan.packages !== 'object' || Array.isArray(plan.packages)) {
        throw new Error(`${file} must contain a packages object`)
      }
      // Copy only the schema fields so plan data can never override the
      // internal paths that release:prepare later removes.
      return { file, filePath, summary: plan.summary, packages: plan.packages }
    })
}

function packageDependencies(entry, packageNames) {
  const dependencies = new Set()
  for (const field of dependencyFields) {
    for (const name of Object.keys(entry.manifest[field] ?? {})) {
      if (packageNames.has(name)) {
        dependencies.add(name)
      }
    }
  }
  return dependencies
}

function orderPackages(selected, packages) {
  const packageNames = new Set(packages.keys())
  const remaining = new Set(selected)
  const ordered = []

  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter(name => [...packageDependencies(packages.get(name), packageNames)]
        .every(dependency => !remaining.has(dependency)))
      .sort()

    if (ready.length === 0) {
      // Cyclic workspace dependencies can still be published because npm does not
      // require dependency versions to exist before accepting a tarball.
      ordered.push(...[...remaining].sort())
      break
    }

    for (const name of ready) {
      remaining.delete(name)
      ordered.push(name)
    }
  }

  return ordered
}

function resolvedDependencies(entry, versions) {
  const result = {}
  for (const field of dependencyFields) {
    for (const [name, range] of Object.entries(entry.manifest[field] ?? {})) {
      if (typeof range === 'string' && range.startsWith('workspace:') && versions.has(name)) {
        result[`${field}.${name}`] = versions.get(name)
      }
    }
  }
  return result
}

export function createRelease() {
  const packages = readPackages()
  const plans = readPlans()
  if (plans.length === 0) {
    throw new Error(`No release plans found in ${path.relative(root, plansDirectory)}`)
  }

  const bumps = new Map()
  const reasons = new Map()

  for (const plan of plans) {
    for (const [name, bump] of Object.entries(plan.packages)) {
      if (!packages.has(name)) {
        throw new Error(`${plan.file} references unknown package ${name}`)
      }
      if (!bumpRank.has(bump)) {
        throw new Error(`${plan.file} has invalid bump ${bump} for ${name}`)
      }
      bumps.set(name, highestBump(bumps.get(name), bump))
      const packageReasons = reasons.get(name) ?? []
      packageReasons.push(plan.summary.trim())
      reasons.set(name, packageReasons)
    }
  }

  // Publish workspace dependents with at least a patch bump so their packed
  // dependency ranges point at the newly released dependency versions.
  let changed = true
  while (changed) {
    changed = false
    for (const [name, entry] of packages) {
      if (bumps.has(name)) {
        continue
      }
      const dependency = [...packageDependencies(entry, new Set(packages.keys()))]
        .find(candidate => bumps.has(candidate))
      if (!dependency) {
        continue
      }
      bumps.set(name, 'patch')
      reasons.set(name, [`Republish for updated workspace dependency ${dependency}.`])
      changed = true
    }
  }

  const versions = new Map([...packages].map(([name, entry]) => [name, entry.manifest.version]))
  for (const [name, bump] of bumps) {
    versions.set(name, bumpVersion(packages.get(name).manifest.version, bump))
  }

  const order = orderPackages(new Set(bumps.keys()), packages)
  return {
    packages,
    plans,
    releases: order.map(name => {
      const entry = packages.get(name)
      const version = versions.get(name)
      return {
        name,
        directory: entry.directory,
        manifestPath: entry.manifestPath,
        previousVersion: entry.manifest.version,
        version,
        bump: bumps.get(name),
        tag: `${name}@${version}`,
        reasons: reasons.get(name) ?? [],
        resolvedDependencies: resolvedDependencies(entry, versions)
      }
    })
  }
}
