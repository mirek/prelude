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

const changed = []
for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue
  }

  const makefile = path.join(packagesDirectory, entry.name, 'Makefile')
  if (!existsSync(makefile)) {
    continue
  }

  const original = readFileSync(makefile, 'utf8')
  const normalized = normalizeMakefile(original)
  if (normalized === original) {
    continue
  }

  changed.push(path.relative(root, makefile))
  if (write) {
    writeFileSync(makefile, normalized)
  }
}

if (changed.length > 0) {
  const message = `Unsafe package release hooks remain:\n${changed.map(file => `- ${file}`).join('\n')}`
  if (!write) {
    throw new Error(`${message}\nRun pnpm release-hooks:write.`)
  }
  console.log(message)
}
