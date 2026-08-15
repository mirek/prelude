import { existsSync, rmSync, writeFileSync } from 'node:fs'
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
    const error = new Error(`tsc ${args.join(' ')} failed with status ${result.status}`)
    error.status = result.status ?? 1
    throw error
  }
}

export function buildPackage(directory = process.cwd()) {
  const config = path.join(directory, 'tsconfig.lib.json')
  const source = path.join(directory, 'src')
  const output = path.join(directory, 'mjs')

  if (!existsSync(config)) {
    throw new Error(`Missing ${path.relative(process.cwd(), config)}`)
  }

  // The workspace tsconfig maps sibling packages to their sources so a clean
  // checkout type-checks. Emitting through that mapping would also emit the
  // siblings' sources — outside this package's rootDir, straight into their
  // src/ directories. Emit therefore resolves siblings the way consumers do:
  // through node_modules and their built declarations. Build in dependency
  // order (see scripts/workspace.mjs) so those declarations exist.
  // The config lives next to the real one so `types` and module lookups
  // resolve from the package directory; it is removed once emit finishes.
  const emitConfig = path.join(directory, 'tsconfig.emit.json')
  writeFileSync(emitConfig, `${JSON.stringify({
    extends: './tsconfig.lib.json',
    compilerOptions: { paths: {} }
  }, null, 2)}\n`)

  try {
    rmSync(output, { force: true, recursive: true })
    runTypeScript([
      '--project', emitConfig,
      '--declaration',
      '--sourceMap',
      '--outDir', output,
      '--rootDir', source
    ], directory)
  } finally {
    rmSync(emitConfig, { force: true })
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (invokedPath === import.meta.url) {
  try {
    buildPackage(process.cwd())
  } catch (error) {
    if (typeof error?.status !== 'number') {
      throw error
    }
    process.exitCode = error.status
  }
}
