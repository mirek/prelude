import { existsSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')

function runTypeScript(args, cwd) {
  const result = spawnSync(process.execPath, [tsc, ...args], {
    cwd,
    stdio: 'inherit'
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

export function buildPackage(directory = process.cwd()) {
  const config = path.join(directory, 'tsconfig.lib.json')
  const source = path.join(directory, 'src')
  const output = path.join(directory, 'mjs')

  if (!existsSync(config)) {
    throw new Error(`Missing ${path.relative(process.cwd(), config)}`)
  }

  runTypeScript(['--project', config, '--noEmit'], directory)

  rmSync(output, { force: true, recursive: true })
  runTypeScript([
    '--project', config,
    '--noCheck',
    '--declaration',
    '--sourceMap',
    '--outDir', output,
    '--rootDir', source
  ], directory)
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (invokedPath === import.meta.url) {
  buildPackage(process.cwd())
}
