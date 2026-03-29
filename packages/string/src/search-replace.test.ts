import * as S from './index.js'
import * as Fs from 'node:fs'
import * as Path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = Path.dirname(fileURLToPath(import.meta.url))

function parseQuery(query: string) {
  const match = query.match(/^> SEARCH\n([\s\S]*?)\n= REPLACE\n([\s\S]*?)\n< END\n$/m)
  if (!match) {
    throw new Error(`Invalid query format:\n${query}`)
  }
  return { search: match[1], replace: match[2] }
}

function fixture(name: string) {
  const query = Fs.readFileSync(Path.join(__dirname, `../fixtures/${name}.query.txt`), 'utf8')
  const source = Fs.readFileSync(Path.join(__dirname, `../fixtures/${name}.source.txt`), 'utf8')
  const target = Fs.readFileSync(Path.join(__dirname, `../fixtures/${name}.target.txt`), 'utf8')
  const { search, replace } = parseQuery(query)
  expect(S.searchReplace(source, search, replace)).toEqual(target)
}

test('searchReplace', () => {
  expect(S.searchReplace('hello\nworld', 'wrld', 'universe')).toEqual('hello\nuniverse')
  fixture('search-replace.01')
})
