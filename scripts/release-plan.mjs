import { spawnSync } from 'node:child_process'
import { createRelease, root } from './release-lib.mjs'

const pnpmCli = process.env.npm_execpath
if (!pnpmCli) {
  throw new Error('release:plan must be run through pnpm')
}

function packFiles(release) {
  const result = spawnSync(process.execPath, [pnpmCli, 'pack', '--dry-run', '--json'], {
    cwd: release.directory,
    encoding: 'utf8'
  })

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? '')
    process.stderr.write(result.stderr ?? '')
    throw new Error(`Could not inspect ${release.name} tarball`)
  }

  const data = JSON.parse(result.stdout)
  const report = Array.isArray(data) ? data[0] : data
  return report.files
    .map(file => typeof file === 'string' ? file : file.path)
    .map(file => file.replace(/^package\//, ''))
    .sort()
}

const release = createRelease()
console.log('Release plans:')
for (const plan of release.plans) {
  console.log(`- ${plan.file}: ${plan.summary}`)
}

console.log('\nPackages (dependency order):')
for (const item of release.releases) {
  console.log(`\n${item.name}: ${item.previousVersion} -> ${item.version} (${item.bump})`)
  console.log(`tag: ${item.tag}`)
  for (const reason of item.reasons) {
    console.log(`reason: ${reason}`)
  }
  for (const [dependency, version] of Object.entries(item.resolvedDependencies)) {
    console.log(`packed range: ${dependency} -> ${version}`)
  }
  console.log('tarball:')
  for (const file of packFiles(item)) {
    console.log(`  - ${file}`)
  }
}

console.log(`\nDry run complete. No Git refs or npm packages were changed in ${root}.`)
