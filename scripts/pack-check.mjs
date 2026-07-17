import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const packages = path.join(root, 'packages')
const pnpmCli = process.env.npm_execpath

if (!pnpmCli) {
  throw new Error('pack-check must be run through pnpm')
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

function packedFiles(stdout, packageName) {
  let data
  try {
    data = JSON.parse(stdout)
  } catch {
    throw new Error(`pnpm pack returned invalid JSON for ${packageName}:\n${stdout}`)
  }

  const report = Array.isArray(data) ? data[0] : data
  const files = report?.files
  if (!Array.isArray(files)) {
    throw new Error(`pnpm pack did not report files for ${packageName}`)
  }

  return new Set(files.map(file => {
    const packedPath = typeof file === 'string' ? file : file.path
    return packedPath.replace(/^package\//, '')
  }))
}

const packageDirectories = readdirSync(packages, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(packages, entry.name))
  .filter(directory => existsSync(path.join(directory, 'package.json')))
  .filter(directory => {
    const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
    return manifest.private !== true && (
      existsSync(path.join(directory, 'tsconfig.lib.json')) ||
      manifest.name === '@prelude/tsconfig'
    )
  })
  .sort()

if (packageDirectories.length === 0) {
  throw new Error('No publishable packages found')
}

for (const directory of packageDirectories) {
  const manifest = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'))
  console.log(`pack-check ${manifest.name}`)

  const result = spawnSync(process.execPath, [pnpmCli, 'pack', '--dry-run', '--json'], {
    cwd: directory,
    encoding: 'utf8'
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.status ?? 1)
  }

  const files = packedFiles(result.stdout, manifest.name)
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
        throw new Error(`${manifest.name} packs no file matching ${target}`)
      }
      continue
    }

    if (!files.has(target)) {
      throw new Error(`${manifest.name} does not pack exported file ${target}`)
    }
  }
}
