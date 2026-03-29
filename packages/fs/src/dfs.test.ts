import * as Path from 'node:path'
import * as Fs from './index.js'
import * as G from '@prelude/async-generator'

const __dirname = Path.dirname(new URL(import.meta.url).pathname)
const testDir = Path.join(__dirname, 'test')

test('simple', async () => {
  expect(G.pipe(
    Fs.dfs(testDir),
    G.map(_ => {
      const relPath = Path.relative(testDir, _.path)
      const relLinkPath = _.linkpath ? Path.relative(testDir, _.linkpath) : null
      return relLinkPath ? `${relPath} -> ${relLinkPath}` : relPath
    }),
    G.array
  )).resolves.toEqual([
    'dfs',
    'dfs/a',
    'dfs/a/.gitkeep',
    'dfs/b -> dfs/a',
    'dfs/c',
    'dfs/c/.gitkeep',
    'dfs/c/parent -> dfs',
  ])
})
