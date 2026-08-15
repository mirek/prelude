import type * as Fs from 'fs'
import writeString from './write-string.js'
import jsonText from './json-text.js'

const writeJsons =
  async (path: Fs.PathLike, values: unknown[]) =>
    writeString(path, values.map(_ => jsonText(_) + '\n'))

export default writeJsons
