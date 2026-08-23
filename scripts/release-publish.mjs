import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { preparedPath, provenanceArgs, publishPrepared, readPackages, root } from './release-lib.mjs'

const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  throw new Error('release:publish must be run through pnpm')
}
if (!existsSync(preparedPath)) {
  throw new Error('No prepared release exists')
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    ...options
  })
  if (result.error) {
    throw result.error
  }
  return result
}

function requireSuccess(command, args, options = {}) {
  const result = run(command, args, options)
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`)
  }
  return result
}

function isPublished(name, version) {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json'])
  if (result.status === 0) {
    return JSON.parse(result.stdout) === version
  }
  if ((result.stderr ?? '').includes('E404')) {
    return false
  }
  process.stderr.write(result.stderr ?? '')
  throw new Error(`Could not determine whether ${name}@${version} is published`)
}

function remoteTagCommit(tag) {
  const result = requireSuccess('git', [
    'ls-remote',
    '--tags',
    'origin',
    `refs/tags/${tag}`,
    `refs/tags/${tag}^{}`
  ])
  const lines = result.stdout.trim().split('\n').filter(Boolean)
  const dereferenced = lines.find(line => line.endsWith(`refs/tags/${tag}^{}`))
  const direct = lines.find(line => line.endsWith(`refs/tags/${tag}`))
  return (dereferenced ?? direct)?.split(/\s+/)[0]
}

const status = requireSuccess('git', ['status', '--porcelain']).stdout.trim()
if (status !== '') {
  throw new Error(`Release publication requires a clean checkout:\n${status}`)
}

const head = requireSuccess('git', ['rev-parse', 'HEAD']).stdout.trim()
const originMain = requireSuccess('git', ['rev-parse', 'origin/main']).stdout.trim()
if (head !== originMain) {
  throw new Error(`Release publication must run at the exact origin/main commit (${originMain}), got ${head}`)
}

const prepared = JSON.parse(readFileSync(preparedPath, 'utf8'))
if (prepared.schemaVersion !== 1 || !Array.isArray(prepared.packages)) {
  throw new Error('Unsupported prepared release format')
}

publishPrepared({
  prepared,
  packages: readPackages(),
  head,
  remoteTagCommit,
  isPublished,
  publish: entry => requireSuccess(process.execPath, [
    pnpmCli,
    'publish',
    '--access', 'public',
    ...provenanceArgs(),
    '--no-git-checks'
  ], {
    cwd: entry.directory,
    stdio: 'inherit',
    encoding: undefined
  })
})

for (const item of prepared.packages) {
  // Re-query rather than trust the preflight: publishing can take a while and a tag deleted or
  // moved meanwhile must be re-created or reported, not silently skipped.
  const remoteCommit = remoteTagCommit(item.tag)
  if (remoteCommit) {
    if (remoteCommit !== head) {
      throw new Error(`Remote tag ${item.tag} points at ${remoteCommit}, expected ${head}`)
    }
    console.log(`skip existing tag ${item.tag}`)
    continue
  }

  const localTag = run('git', ['rev-parse', '-q', '--verify', `refs/tags/${item.tag}`])
  if (localTag.status === 0) {
    requireSuccess('git', ['tag', '-d', item.tag])
  }
  requireSuccess('git', ['tag', '-a', item.tag, '-m', `${item.name} ${item.version}`])
  requireSuccess('git', ['push', 'origin', `refs/tags/${item.tag}`])
  console.log(`tagged ${item.tag}`)
}

console.log(`Published ${prepared.packages.length} prepared packages from ${path.relative(root, preparedPath)}.`)
