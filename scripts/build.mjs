import { existsSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')
const root = fileURLToPath(new URL('..', import.meta.url))
const packages = path.join(root, 'packages')

const projects = readdirSync(packages, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => path.join(packages, entry.name))
  .filter(directory => existsSync(path.join(directory, 'tsconfig.lib.json')))
  .sort()

if (projects.length === 0) {
  throw new Error('No buildable package TypeScript projects found')
}

for (const directory of projects) {
  const config = path.join(directory, 'tsconfig.lib.json')
  const source = path.join(directory, 'src')
  const output = path.join(directory, 'mjs')
  const packageName = path.basename(directory)

  console.log(`build ${packageName}`)
  rmSync(output, { force: true, recursive: true })

  const result = spawnSync(process.execPath, [
    tsc,
    '--project', config,
    '--noCheck',
    '--declaration',
    '--sourceMap',
    '--outDir', output,
    '--rootDir', source
  ], {
    cwd: root,
    stdio: 'inherit'
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
