import { Supervisor } from './supervisor.js'
import type { Options } from './prelude.js'

/** Creates a supervisor. */
export function of(options: Options = {}): Supervisor {
  return new Supervisor(options)
}

export default of
