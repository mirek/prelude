import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const file = fileURLToPath(new URL('../packages/channel/src/channel.ts', import.meta.url))
const source = readFileSync(file, 'utf8')
const before = `  async maybeRead(): Promise<undefined | T> {
    const result = await this.next()
    return result.done ?
      result.value :
      undefined
  }
`
const after = `  /**
   * Reads the next value, returning \`undefined\` after channel completion.
   *
   * When \`T\` includes \`undefined\`, a queued \`undefined\` value and channel
   * completion have the same return value. Use \`next()\` and inspect \`done\` when
   * that distinction matters.
   */
  async maybeRead(): Promise<undefined | T> {
    const result = await this.next()
    return result.done ?
      undefined :
      result.value
  }
`

if (!source.includes(before)) {
  if (source.includes(after)) {
    process.exit(0)
  }
  throw new Error('Channel.maybeRead implementation did not match the expected source')
}

writeFileSync(file, source.replace(before, after))
