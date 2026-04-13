import * as Path from 'node:path'
import * as Fs from './index.js'
import * as G from '@prelude/async-generator'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const __dirname = Path.dirname(new URL(import.meta.url).pathname)
const testDir = Path.join(__dirname, 'test')

await test('simple', async () => {
  assert.deepEqual(await G.pipe(
    Fs.dfs(testDir),
    G.map(_ => {
      const relPath = Path.relative(testDir, _.path)
      const relLinkPath = _.linkpath ? Path.relative(testDir, _.linkpath) : null
      return relLinkPath ? `${relPath} -> ${relLinkPath}` : relPath
    }),
    G.array
  ), [
    'dfs',
    'dfs/a',
    'dfs/a/.gitkeep',
    'dfs/b -> dfs/a',
    'dfs/c',
    'dfs/c/.gitkeep',
    'dfs/c/parent -> dfs',
  ])
})
