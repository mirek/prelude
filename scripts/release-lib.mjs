import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const packagesDirectory = path.join(root, 'packages')

const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies'
]

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

/** Orders package names so that every workspace dependency precedes its dependents. */
export function orderPackages(packages) {
  const packageNames = new Set(packages.keys())
  const remaining = new Set(packageNames)
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

/**
 * Decides, from the workspace manifests alone, what a publish run at `head` has to do.
 * Every registry and remote tag check runs before anything is published because npm
 * versions are immutable.
 *
 * - A version already on npm is skipped; it is tagged only if its tag does not exist yet
 *   (a previous run that died between publishing and tagging).
 * - A version not on npm is published and tagged, unless its tag already exists on the
 *   remote pointing at another commit, which aborts the whole run.
 */
export function planPublish({ packages, head, remoteTagCommit, isPublished }) {
  const plan = []
  for (const name of orderPackages(packages)) {
    const entry = packages.get(name)
    const version = entry.manifest.version
    const tag = `${name}@${version}`
    const remoteCommit = remoteTagCommit(tag)
    const published = isPublished(name, version)
    if (!published && remoteCommit && remoteCommit !== head) {
      throw new Error(`Remote tag ${tag} points at ${remoteCommit}, expected ${head}`)
    }
    plan.push({
      name,
      version,
      tag,
      directory: entry.directory,
      publish: !published,
      createTag: !remoteCommit
    })
  }
  return plan
}

/** Runs a publish plan: publishes every pending package first, then creates the missing tags. */
export function runPublish(plan, { publish, tag, log = console.log }) {
  for (const item of plan) {
    if (!item.publish) {
      log(`skip published ${item.tag}`)
      continue
    }
    log(`publish ${item.tag}`)
    publish(item)
  }
  for (const item of plan) {
    if (!item.createTag) {
      log(`skip existing tag ${item.tag}`)
      continue
    }
    tag(item)
    log(`tagged ${item.tag}`)
  }
  return plan.filter(item => item.publish).length
}

// npm provenance needs a CI OIDC provider; pnpm refuses `--provenance` elsewhere. Default to
// provenance on GitHub Actions only, with RELEASE_PROVENANCE=0|1 as an explicit override for
// bootstrap publishes from a maintainer machine.
export function provenanceArgs(env = process.env) {
  const override = env.RELEASE_PROVENANCE
  if (override === '0' || override === 'false') return ['--no-provenance']
  if (override === '1' || override === 'true') return ['--provenance']
  return env.GITHUB_ACTIONS === 'true' ? ['--provenance'] : []
}
