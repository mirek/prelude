import type * as Fs from 'fs'
import writeString from './write-string.js'
import jsonText from './json-text.js'

type Replacer =
  Parameters<typeof JSON.stringify>[1]

type Space =
  Parameters<typeof JSON.stringify>[2]

const writeJson =
  async (
    path: Fs.PathLike,
    value: unknown,
    replacer: Replacer = null,
    space: Space = 2,
    nl = true
  ) =>
    writeString(path, jsonText(value, replacer, space) + (nl ? '\n' : ''))

export default writeJson
