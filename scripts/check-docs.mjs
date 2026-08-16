import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPackages, root } from './workspace.mjs'

// Documentation and metadata rules for the workspace. Run with --write to
// regenerate the package index in the root README; without it the script
// only checks and fails on the first drift.

const indexStart = '<!-- package-index:start -->'
const indexEnd = '<!-- package-index:end -->'

// Content that has no business in a published README: machine-local paths,
// links to the retired standalone repositories and their SonarCloud projects,
// and license text that contradicts the CC0 manifests and License.md files.
const forbiddenPatterns = [
  [/\/Users\//, 'machine-local path'],
  [/preludejs/, 'link to the retired preludejs organisation'],
  [/sonarcloud/i, 'SonarCloud badge for a project that no longer exists'],
  [/MIT License/, 'MIT license text (the packages are CC0-1.0, see License.md)'],
  [/\/master\//, 'link to a master branch (the default branch is main)']
]

// Descriptions of the form "Array module." or "Repl package." say nothing a
// reader could not get from the name.
const placeholderDescription = /^\s*$|^\S+( \S+)? (module|package)\.?$/i

/** Failures for one package README's text. Exported for tests. */
export function checkReadme(text, { name, directory }) {
  const failures = []
  const relative = path.relative(root, directory)

  for (const [pattern, reason] of forbiddenPatterns) {
    const match = text.match(pattern)
    if (match) {
      failures.push(`${relative}: README contains ${reason}: ${JSON.stringify(match[0])}`)
    }
  }

  if (!/^# \S/m.test(text)) {
    failures.push(`${relative}: README has no top-level heading`)
  }
  if (!text.includes(name)) {
    failures.push(`${relative}: README never mentions ${name}`)
  }
  if (!new RegExp(`(npm i(nstall)?|pnpm add|yarn add)[^\\n]*${name.replace('/', '\\/')}`).test(text)) {
    failures.push(`${relative}: README has no install command for ${name}`)
  }
  const license = text.match(/^#{1,3} License\s*\n([\s\S]*?)(?=^#{1,3} |\s*$(?![\s\S]))/m)
  if (!license) {
    failures.push(`${relative}: README has no License section`)
  } else if (!/\(\.\/License\.md\)|\bCC0/.test(license[1])) {
    failures.push(`${relative}: README License section must point at ./License.md (CC0-1.0)`)
  }

  failures.push(...checkLinks(text, directory, relative))
  return failures
}

/** Relative markdown links must resolve to files in the repository. */
export function checkLinks(text, directory, relative) {
  const failures = []
  const links = text.matchAll(/\]\(([^)\s]+)\)/g)
  for (const [, target] of links) {
    if (/^(https?:|mailto:|#)/.test(target)) {
      continue
    }
    const [file] = target.split('#')
    if (file && !existsSync(path.resolve(directory, file))) {
      failures.push(`${relative}: dead relative link ${target}`)
    }
  }
  return failures
}

/** The root README's package index rendered from the workspace manifests. */
export function renderPackageIndex(packages) {
  const rows = packages
    .map(({ directory, manifest }) => ({ directory: path.relative(root, directory), manifest }))
    .sort((a, b) => a.directory.localeCompare(b.directory))
    .map(({ directory, manifest }) =>
      `| \`${directory}\` | \`${manifest.name}\`${manifest.private ? ' (private)' : ''} | ${manifest.description} |`)
  return [
    indexStart,
    '| Directory | Package | Description |',
    '| --- | --- | --- |',
    ...rows,
    indexEnd
  ].join('\n')
}

export function checkWorkspace({ write = false } = {}) {
  const failures = []
  const packages = readPackages()

  for (const pkg of packages) {
    const relative = path.relative(root, pkg.directory)
    if (placeholderDescription.test(pkg.manifest.description ?? '')) {
      failures.push(`${relative}: package.json description is missing or a placeholder: ${JSON.stringify(pkg.manifest.description ?? '')}`)
    }

    // readdirSync rather than existsSync: on a case-insensitive file system
    // both spellings "exist".
    const readmes = readdirSync(pkg.directory).filter(name => name === 'Readme.md' || name === 'README.md')
    if (readmes.length !== 1) {
      failures.push(`${relative}: expected exactly one of Readme.md/README.md, found ${readmes.length}`)
    }
    if (!existsSync(path.join(pkg.directory, 'License.md'))) {
      failures.push(`${relative}: License.md is missing`)
    }
    for (const readme of readmes) {
      failures.push(...checkReadme(readFileSync(path.join(pkg.directory, readme), 'utf8'), {
        name: pkg.manifest.name,
        directory: pkg.directory
      }))
    }
  }

  const rootManifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (!rootManifest.description) {
    failures.push('package.json: root description is empty')
  }

  const readmePath = path.join(root, 'README.md')
  const readme = readFileSync(readmePath, 'utf8')
  for (const [pattern, reason] of forbiddenPatterns) {
    if (pattern.test(readme)) {
      failures.push(`README.md: contains ${reason}`)
    }
  }
  failures.push(...checkLinks(readme, root, 'README.md'))

  const start = readme.indexOf(indexStart)
  const end = readme.indexOf(indexEnd)
  if (start === -1 || end === -1 || end < start) {
    failures.push(`README.md: package index markers ${indexStart} / ${indexEnd} are missing`)
  } else {
    const current = readme.slice(start, end + indexEnd.length)
    const expected = renderPackageIndex(packages)
    if (current !== expected) {
      if (write) {
        writeFileSync(readmePath, readme.slice(0, start) + expected + readme.slice(end + indexEnd.length))
        console.log('README.md: package index regenerated')
      } else {
        failures.push('README.md: package index is out of date with the workspace manifests, run pnpm docs:write')
      }
    }
  }

  return failures
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = checkWorkspace({ write: process.argv.includes('--write') })
  if (failures.length > 0) {
    throw new Error(`Documentation needs attention:\n${failures.map(failure => `- ${failure}`).join('\n')}`)
  }
  console.log(`Checked documentation and metadata for ${readPackages().length} packages.`)
}
