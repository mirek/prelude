import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildPackage } from './build-package.mjs'

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
  console.log(`build ${path.basename(directory)}`)
  buildPackage(directory)
}
