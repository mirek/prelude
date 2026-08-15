import * as Fs from 'fs'

export const readJsonsSync =
  <T = unknown>(path: Fs.PathLike): T[] => {
    const buffer = Fs.readFileSync(path)
    let a = 0
    let b = buffer.indexOf('\n')
    const result: T[] = []
    while (b !== -1) {
      const line = buffer.subarray(a, b).toString()
      // Blank lines (including a CR left by CRLF endings) separate records; they are not records.
      if (line.trim() !== '') {
        result.push(JSON.parse(line))
      }
      a = b + 1
      b = buffer.indexOf('\n', a)
    }
    // A last record without a trailing newline is still a record.
    const tail = buffer.subarray(a).toString()
    if (tail.trim() !== '') {
      result.push(JSON.parse(tail))
    }
    return result
  }

export default readJsonsSync
