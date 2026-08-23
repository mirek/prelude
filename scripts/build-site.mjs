import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Marked } from 'marked'
import { readPackages, root } from './workspace.mjs'

// Builds the documentation site into site/ from the Markdown that already
// lives in the repository (README.md, packages/*/Readme.md, CHANGELOG.md,
// skills/prelude/SKILL.md) plus a TypeDoc API reference, and publishes the
// agent skill at /.well-known/agent-skills/ with a digest index and llms.txt.
//
//   SITE_URL=https://example.com/prelude node scripts/build-site.mjs
//
// SITE_URL (default https://mirekrusin.com/prelude) is the origin the site is
// served from; its path becomes the base path of every internal link, so the
// same build works for a GitHub project page and for a custom domain.

export const repository = 'https://github.com/mirek/prelude'
export const defaultSiteUrl = 'https://mirekrusin.com/prelude'
export const skillSource = 'skills/prelude/SKILL.md'
export const skillsSchema = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
export const outputDirectory = path.join(root, 'site')

/** Site configuration derived from the URL the site is served at. */
export function siteOf(url = process.env.SITE_URL || defaultSiteUrl) {
  const parsed = new URL(url)
  const base = parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
  return { origin: parsed.origin, base, url: `${parsed.origin}${base}` }
}

/** Packages that get a guide page: every workspace package with a README. */
export function sitePackages(packages = readPackages()) {
  return packages
    .map(({ directory, manifest }) => {
      const readme = ['Readme.md', 'README.md'].map(name => path.join(directory, name)).find(existsSync)
      return {
        directory,
        name: path.basename(directory),
        manifest,
        readme,
        changelog: [path.join(directory, 'CHANGELOG.md')].find(existsSync),
        api: existsSync(path.join(directory, 'src', 'index.ts')) && existsSync(path.join(directory, 'tsconfig.lib.json'))
      }
    })
    .filter(pkg => pkg.readme)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Site path (relative to the base) of a repository file, or undefined when it has no page. */
export function pageOf(repositoryPath) {
  const normalized = repositoryPath.replaceAll(path.sep, '/').replace(/\/$/, '')
  if (normalized === '' || normalized === 'README.md') {
    return ''
  }
  if (normalized === skillSource) {
    return 'skill.html'
  }
  const match = normalized.match(/^packages\/([^/]+)(?:\/(Readme\.md|README\.md|CHANGELOG\.md))?$/)
  if (match && existsSync(path.join(root, 'packages', match[1], 'package.json'))) {
    return match[2] === 'CHANGELOG.md' ? `packages/${match[1]}/changelog.html` : `packages/${match[1]}/`
  }
  return undefined
}

/**
 * Rewrites a Markdown link found in a file at `sourceDirectory` (repository
 * relative) so it works on the site: pages stay on the site, every other
 * repository file points at GitHub, and absolute links are left alone.
 */
export function rewriteLink(target, sourceDirectory, site) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) {
    return target
  }
  const [file, fragment] = target.split('#')
  const repositoryPath = path.posix.normalize(path.posix.join(sourceDirectory.replaceAll(path.sep, '/'), file || '.'))
  const hash = fragment ? `#${fragment}` : ''
  if (repositoryPath.startsWith('..')) {
    return target
  }
  const page = pageOf(repositoryPath)
  if (page !== undefined) {
    return `${site.base}${page}${hash}`
  }
  const absolute = path.join(root, repositoryPath)
  const kind = existsSync(absolute) && !path.extname(repositoryPath) ? 'tree' : 'blob'
  return `${repository}/${kind}/main/${repositoryPath}${hash}`
}

export function slugOf(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/** Renders Markdown from a repository file to HTML with site-aware links. */
export function renderMarkdown(markdown, sourceDirectory, site) {
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link' || token.type === 'image') {
        token.href = rewriteLink(token.href, sourceDirectory, site)
      }
    },
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        return `<h${depth} id="${slugOf(html)}">${html}</h${depth}>\n`
      }
    }
  })
  return marked.parse(markdown)
}

/** Strips YAML front matter; returns { data, body } with the few keys the skill uses. */
export function splitFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return { data: {}, body: text }
  }
  const data = {}
  let key
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (entry) {
      key = entry[1]
      data[key] = entry[2] === '>' || entry[2] === '|' ? '' : entry[2]
    } else if (key !== undefined && /^\s+\S/.test(line)) {
      data[key] = `${data[key]}${data[key] ? ' ' : ''}${line.trim()}`
    }
  }
  return { data, body: text.slice(match[0].length) }
}

/** The well-known discovery index for the published skill. */
export function skillIndex(skillBytes, site) {
  const { data } = splitFrontMatter(skillBytes.toString('utf8'))
  return {
    $schema: skillsSchema,
    skills: [
      {
        name: data.name ?? 'prelude',
        type: 'skill-md',
        description: data.description ?? '',
        url: `${site.base}.well-known/agent-skills/${data.name ?? 'prelude'}/SKILL.md`,
        digest: `sha256:${createHash('sha256').update(skillBytes).digest('hex')}`
      }
    ]
  }
}

export function llmsTxt(packages, site, rootManifest) {
  const lines = [
    '# Prelude',
    '',
    `> ${rootManifest.description}`,
    '',
    'Packages are ESM-only, require Node.js 22 or later and follow one AbortSignal cancellation convention. Exact signatures live in the API reference; the package guides describe semantics and idioms; the agent skill describes how the packages are meant to be used together.',
    '',
    '## Overview',
    '',
    `- [Repository README](${site.url}): workspace layout, quality gate, runtime support, cancellation convention`,
    `- [API reference](${site.url}api/): generated from the TypeScript sources of every package`,
    `- [Every guide as one file](${site.url}llms-full.txt)`,
    '',
    '## Agent skill',
    '',
    `- [prelude SKILL.md](${site.url}.well-known/agent-skills/prelude/SKILL.md): how to choose and combine @prelude/* packages`,
    `- [Skill discovery index](${site.url}.well-known/agent-skills/index.json)`,
    '',
    '## Packages',
    ''
  ]
  for (const pkg of packages) {
    const suffix = pkg.manifest.private ? ' (private, not published)' : ''
    lines.push(`- [${pkg.manifest.name}](${site.url}packages/${pkg.name}/)${suffix}: ${pkg.manifest.description}`)
  }
  lines.push('', '## Changelogs', '')
  for (const pkg of packages.filter(p => p.changelog)) {
    lines.push(`- [${pkg.manifest.name}](${site.url}packages/${pkg.name}/changelog.html)`)
  }
  return `${lines.join('\n')}\n`
}

function layout({ title, body, site, packages, current, description }) {
  const nav = packages.map(pkg =>
    `<li${current === `packages/${pkg.name}/` ? ' class="current"' : ''}><a href="${site.base}packages/${pkg.name}/">${escapeHtml(pkg.manifest.name)}</a></li>`
  ).join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${site.url}${current}">
<link rel="stylesheet" href="${site.base}assets/site.css">
</head>
<body>
<header class="top">
<a class="brand" href="${site.base}">prelude</a>
<nav>
<a href="${site.base}#package-index">Packages</a>
<a href="${site.base}api/">API</a>
<a href="${site.base}skill.html">Agent skill</a>
<a href="${site.base}llms.txt">llms.txt</a>
<a href="${repository}">GitHub</a>
</nav>
</header>
<div class="page">
<aside class="side">
<p class="side-title">Packages</p>
<ul>
${nav}
</ul>
</aside>
<main class="content">
${body}
</main>
</div>
</body>
</html>
`
}

const css = `
:root { --bg: #fff; --fg: #1b1f23; --muted: #57606a; --line: #d8dee4; --code: #f6f8fa; --link: #0a58ca; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #0d1117; --fg: #e6edf3; --muted: #8b949e; --line: #30363d; --code: #161b22; --link: #58a6ff; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }
.top { display: flex; align-items: center; gap: 1.5rem; padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--line); }
.top .brand { font-weight: 700; font-size: 1.15rem; color: var(--fg); }
.top nav { display: flex; flex-wrap: wrap; gap: 1rem; }
.page { display: grid; grid-template-columns: 16rem minmax(0, 1fr); gap: 2rem; max-width: 80rem; margin: 0 auto; padding: 1.5rem; }
.side { position: sticky; top: 1rem; align-self: start; max-height: calc(100vh - 2rem); overflow: auto; font-size: 0.9rem; }
.side ul { list-style: none; padding: 0; margin: 0; }
.side li { padding: 0.1rem 0; }
.side li.current a { font-weight: 700; }
.side-title { margin: 0 0 0.5rem; color: var(--muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
.content { min-width: 0; }
.content h1, .content h2, .content h3 { line-height: 1.25; }
.content h1 { margin-top: 0; }
.content h2 { border-bottom: 1px solid var(--line); padding-bottom: 0.25rem; margin-top: 2rem; }
pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
code { background: var(--code); padding: 0.1em 0.3em; border-radius: 4px; }
pre { background: var(--code); padding: 1rem; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; display: block; overflow-x: auto; max-width: 100%; }
th, td { border: 1px solid var(--line); padding: 0.35rem 0.6rem; text-align: left; vertical-align: top; }
th { background: var(--code); }
blockquote { margin: 0; padding: 0 1rem; color: var(--muted); border-left: 4px solid var(--line); }
img { max-width: 100%; }
.meta { color: var(--muted); font-size: 0.9rem; }
.meta a { margin-right: 1rem; }
.notice { border: 1px solid var(--line); border-radius: 6px; padding: 0.75rem 1rem; background: var(--code); }
@media (max-width: 60rem) { .page { grid-template-columns: 1fr; } .side { position: static; max-height: none; } }
`

function write(relative, content) {
  const target = path.join(outputDirectory, relative)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, content)
}

function packageMeta(pkg, site) {
  const links = [
    `<a href="${repository}/tree/main/packages/${pkg.name}">Source</a>`,
    pkg.api ? `<a href="${site.base}api/modules/${pkg.manifest.name.replace(/[@/]/g, '_')}.html">API reference</a>` : '',
    pkg.changelog ? `<a href="${site.base}packages/${pkg.name}/changelog.html">Changelog</a>` : '',
    pkg.manifest.private ? '' : `<a href="https://www.npmjs.com/package/${pkg.manifest.name}">npm</a>`
  ].filter(Boolean).join('')
  const version = pkg.manifest.private ? 'private, not published' : `v${pkg.manifest.version}`
  return `<p class="meta"><code>${escapeHtml(pkg.manifest.name)}</code> · ${escapeHtml(version)}</p><p class="meta">${links}</p>`
}

export async function runTypedoc(packages, site) {
  const { Application } = await import('typedoc')
  const app = await Application.bootstrapWithPlugins({
    entryPoints: packages.filter(pkg => pkg.api).map(pkg => path.relative(root, pkg.directory)),
    out: path.join(outputDirectory, 'api'),
    name: 'Prelude API',
    navigationLinks: { Guides: site.url, Skill: `${site.url}skill.html`, GitHub: repository }
  })
  const project = await app.convert()
  if (!project) {
    throw new Error('typedoc: conversion failed')
  }
  await app.generateDocs(project, path.join(outputDirectory, 'api'))
  if (app.logger.hasErrors()) {
    throw new Error('typedoc: reported errors')
  }
}

export async function buildSite({ site = siteOf(), typedoc = true } = {}) {
  const packages = sitePackages()
  const rootManifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  rmSync(outputDirectory, { recursive: true, force: true })
  mkdirSync(outputDirectory, { recursive: true })

  write('.nojekyll', '')
  write('assets/site.css', css.trimStart())

  const readme = readFileSync(path.join(root, 'README.md'), 'utf8')
  const intro = `<p class="notice">Guides on this site are the repository READMEs; the <a href="${site.base}api/">API reference</a> is generated from the sources. AI agents: <code>npx skills add ${repository.replace('https://github.com/', '')}</code> or see the <a href="${site.base}skill.html">prelude skill</a>.</p>`
  write('index.html', layout({
    title: 'Prelude',
    description: rootManifest.description,
    body: intro + renderMarkdown(readme, '.', site),
    site, packages, current: ''
  }))

  for (const pkg of packages) {
    const directory = path.relative(root, pkg.directory)
    write(`packages/${pkg.name}/index.html`, layout({
      title: `${pkg.manifest.name} · Prelude`,
      description: pkg.manifest.description,
      body: packageMeta(pkg, site) + renderMarkdown(readFileSync(pkg.readme, 'utf8'), directory, site),
      site, packages, current: `packages/${pkg.name}/`
    }))
    if (pkg.changelog) {
      write(`packages/${pkg.name}/changelog.html`, layout({
        title: `${pkg.manifest.name} changelog · Prelude`,
        description: `Changelog of ${pkg.manifest.name}`,
        body: packageMeta(pkg, site) + renderMarkdown(readFileSync(pkg.changelog, 'utf8'), directory, site),
        site, packages, current: `packages/${pkg.name}/changelog.html`
      }))
    }
  }

  const skillBytes = readFileSync(path.join(root, skillSource))
  const { body: skillBody } = splitFrontMatter(skillBytes.toString('utf8'))
  const index = skillIndex(skillBytes, site)
  write(`.well-known/agent-skills/${index.skills[0].name}/SKILL.md`, skillBytes)
  write('.well-known/agent-skills/index.json', `${JSON.stringify(index, null, 2)}\n`)
  write('skill.html', layout({
    title: 'Agent skill · Prelude',
    description: index.skills[0].description,
    body: `<p class="notice">Install with <code>npx skills add ${repository.replace('https://github.com/', '')}</code>. Source: <a href="${repository}/blob/main/${skillSource}">${skillSource}</a>; published at <a href="${site.base}.well-known/agent-skills/index.json">/.well-known/agent-skills/index.json</a> (${index.skills[0].digest}).</p>`
      + renderMarkdown(skillBody, path.dirname(skillSource), site),
    site, packages, current: 'skill.html'
  }))

  write('llms.txt', llmsTxt(packages, site, rootManifest))
  write('llms-full.txt', [
    readme,
    `# Agent skill (${skillSource})\n\n${skillBody}`,
    ...packages.map(pkg => `# ${pkg.manifest.name}\n\n${readFileSync(pkg.readme, 'utf8')}`)
  ].join('\n\n---\n\n'))

  if (typedoc) {
    await runTypedoc(packages, site)
  }

  cpSync(path.join(root, 'License.md'), path.join(outputDirectory, 'License.md'))
  return { packages, index }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const site = siteOf()
  const { packages, index } = await buildSite({ site, typedoc: !process.argv.includes('--no-typedoc') })
  console.log(`site: ${packages.length} package pages, skill ${index.skills[0].digest} → ${path.relative(root, outputDirectory)}/ for ${site.url}`)
}
