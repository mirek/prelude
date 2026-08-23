import { spawnSync } from 'node:child_process'
import { planPublish, provenanceArgs, readPackages, root, runPublish } from './release-lib.mjs'

const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  throw new Error('release:publish must be run through pnpm')
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

const plan = planPublish({ packages: readPackages(), head, remoteTagCommit, isPublished })

const published = runPublish(plan, {
  publish: item => requireSuccess(process.execPath, [
    pnpmCli,
    'publish',
    '--access', 'public',
    ...provenanceArgs(),
    '--no-git-checks'
  ], {
    cwd: item.directory,
    stdio: 'inherit',
    encoding: undefined
  }),
  tag: item => {
    // Re-query rather than trust the plan: publishing can take a while and a tag created
    // meanwhile must be reported, not overwritten.
    const remoteCommit = remoteTagCommit(item.tag)
    if (remoteCommit) {
      if (remoteCommit !== head) {
        throw new Error(`Remote tag ${item.tag} points at ${remoteCommit}, expected ${head}`)
      }
      return
    }
    const localTag = run('git', ['rev-parse', '-q', '--verify', `refs/tags/${item.tag}`])
    if (localTag.status === 0) {
      requireSuccess('git', ['tag', '-d', item.tag])
    }
    requireSuccess('git', ['tag', '-a', item.tag, '-m', `${item.name} ${item.version}`])
    requireSuccess('git', ['push', 'origin', `refs/tags/${item.tag}`])
  }
})

console.log(`Published ${published} of ${plan.length} public packages.`)
