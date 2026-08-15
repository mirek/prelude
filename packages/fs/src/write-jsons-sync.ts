import type * as Fs from 'fs'
import writeStringSync from './write-string-sync.js'

const writeJsons =
  (path: Fs.PathLike, values: unknown[]) =>
    writeStringSync(path, values.map(_ => JSON.stringify(_) + '\n').join(''))

export default writeJsons
