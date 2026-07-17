import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const packagesDirectory = path.join(root, 'packages')
const write = process.argv.includes('--write')
const removedTargets = new Set(['preversion', 'postversion'])

function normalizeMakefile(content) {
  const lines = content.split('\n')
  const result = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const target = /^([^\s:#]+)\s*:/.exec(line)?.[1]

    if (target && removedTargets.has(target)) {
      while (index + 1 < lines.length && /^\t/.test(lines[index + 1])) {
        index += 1
      }
      if (lines[index + 1] === '') {
        index += 1
      }
      continue
    }

    if (line.startsWith('.PHONY:')) {
      const targets = line.slice('.PHONY:'.length)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .filter(candidate => !removedTargets.has(candidate))
      result.push(targets.length > 0 ? `.PHONY: ${targets.join(' ')}` : '')
      continue
    }

    result.push(line)
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n')
}

function normalizeManifest(content) {
  const manifest = JSON.parse(content)
  if (!manifest.scripts) {
    return content
  }

  const scripts = { ...manifest.scripts }
  delete scripts.preversion
  delete scripts.postversion
  manifest.scripts = scripts
  return `${JSON.stringify(manifest, null, 2)}\n`
}

function update(filePath, normalize, changed) {
  if (!existsSync(filePath)) {
    return
  }

  const original = readFileSync(filePath, 'utf8')
  const normalized = normalize(original)
  if (normalized === original) {
    return
  }

  changed.push(path.relative(root, filePath))
  if (write) {
    writeFileSync(filePath, normalized)
  }
}

const changed = []
for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue
  }

  const directory = path.join(packagesDirectory, entry.name)
  update(path.join(directory, 'package.json'), normalizeManifest, changed)
  update(path.join(directory, 'Makefile'), normalizeMakefile, changed)
}

if (changed.length > 0) {
  const message = `Unsafe package release hooks remain:\n${changed.map(file => `- ${file}`).join('\n')}`
  if (!write) {
    throw new Error(`${message}\nRun pnpm release-hooks:write.`)
  }
  console.log(message)
}
