import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const packagesDirectory = path.join(root, 'packages')

// Package builds go through scripts/build-package.mjs: it emits with the
// workspace `paths` alias disabled, so sibling sources are neither pulled into
// the program (TS6059) nor emitted into the sibling's src/. A recipe that runs
// `tsc -p <config>` itself does both.
const directTypeScriptBuild = /\btsc\b.*\s(-p|--project)(\s|$)/

// make and pnpm run recipes and scripts through /bin/sh, which has no
// globstar: an unquoted `src/**/*.test.ts` expands to nested files only (or to
// `*` semantics) and silently drops the rest. Quoted, the runner expands it.
function hasUnquotedRecursiveGlob(command) {
  return /\*\*/.test(command.replace(/'[^']*'|"[^"]*"/g, ''))
}

function checkCommand(command, location, failures) {
  if (directTypeScriptBuild.test(command)) {
    failures.push(`${location}: builds with tsc directly, delegate to \`node ../../scripts/build-package.mjs\``)
  }
  if (hasUnquotedRecursiveGlob(command)) {
    failures.push(`${location}: unquoted \`**\` glob, quote it so the test runner expands it`)
  }
}

function checkMakefile(filePath, failures) {
  const lines = readFileSync(filePath, 'utf8').split('\n')
  lines.forEach((line, index) => {
    if (line.startsWith('\t')) {
      checkCommand(line, `${path.relative(root, filePath)}:${index + 1}`, failures)
    }
  })
}

function checkManifest(filePath, failures) {
  const scripts = JSON.parse(readFileSync(filePath, 'utf8')).scripts ?? {}
  for (const [name, command] of Object.entries(scripts)) {
    checkCommand(command, `${path.relative(root, filePath)} scripts.${name}`, failures)
  }
}

const failures = []
for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue
  }
  const directory = path.join(packagesDirectory, entry.name)
  for (const [file, check] of [['Makefile', checkMakefile], ['package.json', checkManifest]]) {
    const filePath = path.join(directory, file)
    if (existsSync(filePath)) {
      check(filePath, failures)
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Package Makefiles/scripts need repair:\n${failures.map(failure => `- ${failure}`).join('\n')}`)
}
