import {
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { createRelease, preparedPath, root } from './release-lib.mjs'

function changelogEntry(item, date) {
  return [
    `## ${item.version} - ${date}`,
    '',
    ...item.reasons.map(reason => `- ${reason}`),
    ''
  ].join('\n')
}

const release = createRelease()
const date = new Date().toISOString().slice(0, 10)

for (const item of release.releases) {
  const manifest = JSON.parse(readFileSync(item.manifestPath, 'utf8'))
  if (manifest.version !== item.previousVersion) {
    throw new Error(`${item.name} changed while preparing the release`)
  }
  manifest.version = item.version
  writeFileSync(item.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const changelogPath = path.join(item.directory, 'CHANGELOG.md')
  const previous = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8').replace(/^# Changelog\s*/, '')
    : ''
  writeFileSync(
    changelogPath,
    `# Changelog\n\n${changelogEntry(item, date)}${previous.trimStart()}`
  )
}

const prepared = {
  schemaVersion: 1,
  preparedAt: new Date().toISOString(),
  plans: release.plans.map(plan => ({
    file: plan.file,
    summary: plan.summary
  })),
  packages: release.releases.map(item => ({
    name: item.name,
    previousVersion: item.previousVersion,
    version: item.version,
    tag: item.tag,
    reasons: item.reasons,
    resolvedDependencies: item.resolvedDependencies
  }))
}

writeFileSync(preparedPath, `${JSON.stringify(prepared, null, 2)}\n`)
for (const plan of release.plans) {
  rmSync(plan.filePath)
}

console.log(`Prepared ${prepared.packages.length} packages.`)
console.log(`Review the changes under packages/ and ${path.relative(root, preparedPath)}, then open a normal pull request.`)
