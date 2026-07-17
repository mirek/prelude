import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')
const root = fileURLToPath(new URL('..', import.meta.url))
const packages = path.join(root, 'packages')
const configNames = ['tsconfig.lib.json', 'tsconfig.test.json']

const configs = readdirSync(packages, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .flatMap(entry => configNames.map(name => path.join(packages, entry.name, name)))
  .filter(existsSync)
  .sort()

if (configs.length === 0) {
  throw new Error('No package TypeScript projects found')
}

for (const config of configs) {
  const relativeConfig = path.relative(root, config)
  console.log(`typecheck ${relativeConfig}`)

  const result = spawnSync(process.execPath, [tsc, '--project', config, '--noEmit'], {
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
