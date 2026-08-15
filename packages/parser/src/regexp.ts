import * as Result from './result.js'
import type * as Parser from './parser.js'

type Indices = [number, number][] & { groups?: Record<string, [number, number]> }

/**
 * @param inputRe regular expression to match.
 * @param valueGroup group to use as parsing result (default 0).
 * @param advanceGroup group to use to advance parser on successful match (default 0).
 * @returns parser consuming input matching provided regular expression.
 */
export function regexp(
  inputRe: RegExp,
  valueGroup: number | string = 0,
  advanceGroup: number | string = 0
): Parser.t<string> {
  const re = new RegExp(inputRe.source, 'dy' + inputRe.flags.replace(/[dyg]/g, ''))
  return function (reader) {
    re.lastIndex = reader.offset
    const match = re.exec(reader.input)
    if (!match) {
      return Result.fail(reader, `regexp ${re} did not match`)
    }
    // A group that does not exist is a programming error; one that exists but did not
    // participate in this match (e.g. the other side of an alternation) is a parse failure.
    const hasGroup =
      (group: number | string) =>
        typeof group === 'string' ?
          match.groups !== undefined && group in match.groups :
          group >= 0 && group < match.length
    if (!hasGroup(valueGroup)) {
      throw new Error(`invalid value group ${String(valueGroup)}`)
    }
    if (!hasGroup(advanceGroup)) {
      throw new Error(`invalid advance group ${String(advanceGroup)}`)
    }
    const valueString =
      typeof valueGroup === 'string' ?
        match.groups?.[valueGroup] :
        match[valueGroup]
    if (typeof valueString !== 'string') {
      return Result.fail(reader, `regexp ${re} matched but group ${String(valueGroup)} did not participate`)
    }
    const indices = match['indices'] as undefined | Indices
    if (!indices) {
      throw new Error('undefined indices')
    }
    const advanceIndices =
      typeof advanceGroup === 'string' ?
        indices.groups?.[advanceGroup] :
        indices[advanceGroup]
    if (!advanceIndices) {
      return Result.fail(reader, `regexp ${re} matched but group ${String(advanceGroup)} did not participate`)
    }
    return Result.ok(reader, valueString, advanceIndices[1] - reader.offset)
  }
}

export { regexp as re }

export default regexp
