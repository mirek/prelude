import type { Assert } from './prelude.js'

/** Always passes — accepts any value. */
const unknown_: Assert<unknown> =
  value => value

export default unknown_
