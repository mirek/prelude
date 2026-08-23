import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  llmsTxt,
  pageOf,
  renderMarkdown,
  rewriteLink,
  siteOf,
  skillIndex,
  splitFrontMatter
} from './build-site.mjs'

const project = siteOf('https://mirekrusin.com/prelude')
const domain = siteOf('https://prelude.example.com')

test('siteOf derives origin, base path and url', () => {
  assert.deepEqual(project, { origin: 'https://mirekrusin.com', base: '/prelude/', url: 'https://mirekrusin.com/prelude/' })
  assert.deepEqual(domain, { origin: 'https://prelude.example.com', base: '/', url: 'https://prelude.example.com/' })
})

test('pageOf maps repository files to site pages', () => {
  assert.equal(pageOf('README.md'), '')
  assert.equal(pageOf('packages/channel'), 'packages/channel/')
  assert.equal(pageOf('packages/channel/Readme.md'), 'packages/channel/')
  assert.equal(pageOf('packages/channel/CHANGELOG.md'), 'packages/channel/changelog.html')
  assert.equal(pageOf('skills/prelude/SKILL.md'), 'skill.html')
  assert.equal(pageOf('packages/channel/src/index.ts'), undefined)
  assert.equal(pageOf('License.md'), undefined)
  assert.equal(pageOf('packages/README.md'), undefined)
})

test('rewriteLink keeps absolute links and fragments', () => {
  assert.equal(rewriteLink('https://example.com/x', 'packages/actor', project), 'https://example.com/x')
  assert.equal(rewriteLink('mailto:a@b.c', '.', project), 'mailto:a@b.c')
  assert.equal(rewriteLink('#usage', 'packages/actor', project), '#usage')
})

test('rewriteLink points sibling package links at their site pages', () => {
  assert.equal(rewriteLink('../channel', 'packages/actor', project), '/prelude/packages/channel/')
  assert.equal(rewriteLink('../channel#usage', 'packages/actor', domain), '/packages/channel/#usage')
  assert.equal(rewriteLink('../../README.md', 'packages/actor', project), '/prelude/')
  assert.equal(rewriteLink('../README.md', 'packages/actor', project), 'https://github.com/mirek/prelude/blob/main/packages/README.md')
  assert.equal(rewriteLink('./CHANGELOG.md', 'packages/actor', project), '/prelude/packages/actor/changelog.html')
})

test('rewriteLink points other repository files at GitHub', () => {
  assert.equal(rewriteLink('./License.md', 'packages/actor', project), 'https://github.com/mirek/prelude/blob/main/packages/actor/License.md')
  assert.equal(rewriteLink('src/map.ts', 'packages/generator', project), 'https://github.com/mirek/prelude/blob/main/packages/generator/src/map.ts')
  assert.equal(rewriteLink('.changeset/README.md', '.', project), 'https://github.com/mirek/prelude/blob/main/.changeset/README.md')
  assert.equal(rewriteLink('packages/channel/src', '.', project), 'https://github.com/mirek/prelude/tree/main/packages/channel/src')
})

test('renderMarkdown rewrites links and gives headings ids', () => {
  const html = renderMarkdown('# Actor module\n\nBuilt on [`@prelude/channel`](../channel).', 'packages/actor', project)
  assert.match(html, /<h1 id="actor-module">Actor module<\/h1>/)
  assert.match(html, /<a href="\/prelude\/packages\/channel\/"><code>@prelude\/channel<\/code><\/a>/)
})

test('splitFrontMatter reads folded scalars and strips the block', () => {
  const { data, body } = splitFrontMatter('---\nname: prelude\ndescription: >\n  Line one\n  line two.\n---\n# Title\n')
  assert.deepEqual(data, { name: 'prelude', description: 'Line one line two.' })
  assert.equal(body, '# Title\n')
  assert.deepEqual(splitFrontMatter('# No front matter\n'), { data: {}, body: '# No front matter\n' })
})

test('skillIndex digests the raw skill bytes', () => {
  const bytes = Buffer.from('---\nname: prelude\ndescription: Use Prelude.\n---\n# Prelude\n')
  const index = skillIndex(bytes, project)
  assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json')
  assert.deepEqual(index.skills, [{
    name: 'prelude',
    type: 'skill-md',
    description: 'Use Prelude.',
    url: '/prelude/.well-known/agent-skills/prelude/SKILL.md',
    digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`
  }])
})

test('llmsTxt lists packages with absolute urls and marks private ones', () => {
  const packages = [
    { name: 'channel', manifest: { name: '@prelude/channel', description: 'Channels.' }, changelog: '/x/CHANGELOG.md' },
    { name: 'testing', manifest: { name: '@prelude/testing', description: 'Helpers.', private: true } }
  ]
  const text = llmsTxt(packages, domain, { description: 'Workspace.' })
  assert.match(text, /^# Prelude\n\n> Workspace\.\n/)
  assert.match(text, /- \[@prelude\/channel\]\(https:\/\/prelude\.example\.com\/packages\/channel\/\): Channels\./)
  assert.match(text, /- \[@prelude\/testing\]\(https:\/\/prelude\.example\.com\/packages\/testing\/\) \(private, not published\): Helpers\./)
  assert.match(text, /## Changelogs\n\n- \[@prelude\/channel\]\(https:\/\/prelude\.example\.com\/packages\/channel\/changelog\.html\)\n$/)
  assert.match(text, /\.well-known\/agent-skills\/index\.json/)
})
