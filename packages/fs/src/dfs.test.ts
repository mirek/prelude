import * as Path from 'node:path'
import { tmpdir } from 'node:os'
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import * as Fs from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const unsupportedSymlinkCodes = new Set([ 'EPERM', 'EACCES', 'ENOTSUP' ])

const relative =
  (root: string, path: string) =>
    Path.relative(root, path).split(Path.sep).join('/')

async function fixture(
  t: { skip(message?: string): void },
  f: (root: string, outside: string) => Promise<void>
) {
  const directory = await mkdtemp(Path.join(tmpdir(), 'prelude-fs-dfs-'))
  const root = Path.join(directory, 'root')
  const outside = Path.join(directory, 'outside')

  try {
    await mkdir(Path.join(root, 'z-target'), { recursive: true })
    await mkdir(outside, { recursive: true })
    await writeFile(Path.join(root, 'z-target', 'inside.txt'), 'inside')
    await writeFile(Path.join(outside, 'secret.txt'), 'outside')

    try {
      await symlink('z-target', Path.join(root, 'a-link'), 'dir')
      await symlink('.', Path.join(root, 'b-cycle'), 'dir')
      await symlink('missing', Path.join(root, 'c-dangling'), 'dir')
      await symlink(outside, Path.join(root, 'd-escape'), 'dir')
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code
      if (code && unsupportedSymlinkCodes.has(code)) {
        t.skip(`symbolic links are unavailable on this platform (${code})`)
        return
      }
      throw error
    }

    await f(root, outside)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

async function paths(root: string, options?: Fs.DfsOptions) {
  const entries: string[] = []
  for await (const entry of Fs.dfs(root, () => true, options)) {
    entries.push(relative(root, entry.path))
  }
  return entries
}

await test('follows relative links once, breaks cycles, and ignores dangling links', async t => {
  await fixture(t, async root => {
    assert.deepEqual(await paths(root), [
      'a-link',
      'a-link/inside.txt',
      'b-cycle',
      'c-dangling',
      'd-escape',
      'z-target'
    ])
  })
})

await test('does not follow directory links when disabled', async t => {
  await fixture(t, async root => {
    assert.deepEqual(await paths(root, { followLinks: false }), [
      'a-link',
      'b-cycle',
      'c-dangling',
      'd-escape',
      'z-target',
      'z-target/inside.txt'
    ])
  })
})

await test('does not traverse outside the requested root by default', async t => {
  await fixture(t, async root => {
    const entries = await paths(root)
    assert.equal(entries.includes('d-escape/secret.txt'), false)
  })
})

await test('can explicitly follow a directory link outside the root', async t => {
  await fixture(t, async root => {
    assert.deepEqual(await paths(root, { allowOutsideRoot: true }), [
      'a-link',
      'a-link/inside.txt',
      'b-cycle',
      'c-dangling',
      'd-escape',
      'd-escape/secret.txt',
      'z-target'
    ])
  })
})

await test('reports normalized link targets without traversing rejected links', async t => {
  await fixture(t, async (root, outside) => {
    const links = new Map<string, string | undefined>()
    for await (const entry of Fs.dfs(root, () => false)) {
      if (entry.dirent.isSymbolicLink()) {
        links.set(relative(root, entry.path), entry.linkpath)
      }
    }

    assert.deepEqual(links, new Map([
      [ 'a-link', Path.join(root, 'z-target') ],
      [ 'b-cycle', root ],
      [ 'c-dangling', Path.join(root, 'missing') ],
      [ 'd-escape', outside ]
    ]))
  })
})
