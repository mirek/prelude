import type * as Fs from 'fs'
import writeStringSync from './write-string-sync.js'
import jsonText from './json-text.js'

const writeJsons =
  (path: Fs.PathLike, values: unknown[]) =>
    writeStringSync(path, values.map(_ => jsonText(_) + '\n').join(''))

export default writeJsons
