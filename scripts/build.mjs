import { existsSync } from 'node:fs'
import path from 'node:path'
import { buildPackage } from './build-package.mjs'
import { readPackages, sortByDependencies, workspaceDependencies } from './workspace.mjs'

const packages = sortByDependencies(readPackages())
  .filter(pkg => existsSync(path.join(pkg.directory, 'tsconfig.lib.json')))

if (packages.length === 0) {
  throw new Error('No buildable package TypeScript projects found')
}

// Build in dependency order. A package whose workspace dependency failed to
// build is skipped (its declarations would be missing) and reported; every
// other package is still built so one failure does not hide the rest.
const names = new Set(packages.map(pkg => pkg.manifest.name))
const failed = new Map()

for (const pkg of packages) {
  const name = pkg.manifest.name
  const blockedBy = [...workspaceDependencies(pkg.manifest, names)].filter(dependency => failed.has(dependency))
  if (blockedBy.length > 0) {
    console.log(`skip ${path.basename(pkg.directory)} (depends on failed ${blockedBy.join(', ')})`)
    failed.set(name, `blocked by ${blockedBy.join(', ')}`)
    continue
  }
  console.log(`build ${path.basename(pkg.directory)}`)
  try {
    buildPackage(pkg.directory)
  } catch (error) {
    if (typeof error?.status !== 'number') {
      throw error
    }
    failed.set(name, 'tsc failed')
  }
}

if (failed.size > 0) {
  console.error(`Build failed for ${failed.size} package(s):\n${[...failed].map(([name, why]) => `- ${name}: ${why}`).join('\n')}`)
  process.exit(1)
}
