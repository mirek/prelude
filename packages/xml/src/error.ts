/** A well-formedness or namespace error with the position where it was detected. */
export class XmlError extends Error {
  /** Zero-based offset into the (line-end normalized) input, in UTF-16 code units. */
  readonly offset: number
  /** One-based line. */
  readonly line: number
  /** One-based column, in UTF-16 code units. */
  readonly column: number

  constructor(message: string, offset: number, line: number, column: number) {
    super(`${message} (line ${line}, column ${column})`)
    this.name = 'XmlError'
    this.offset = offset
    this.line = line
    this.column = column
  }
}

export default XmlError
