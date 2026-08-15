import type { Supervised, Supervisor } from '@prelude/actor'

/**
 * Which children are restarted when one fails.
 *
 * - `one-for-one` — only the failing child.
 * - `all-for-one` — every child.
 * - `rest-for-one` — the failing child and every child started after it.
 */
export type Strategy =
  | 'one-for-one'
  | 'all-for-one'
  | 'rest-for-one'

export interface Options {

  readonly name?: string

  /** Defaults to `'one-for-one'`. */
  readonly strategy?: Strategy

  /** Maximum restarts allowed within `window` before giving up. Defaults to `3`. */
  readonly maxRestarts?: number

  /** Length of the restart window in milliseconds. Defaults to `5000`. */
  readonly window?: number

  /** Clock used for the restart window; defaults to `Date.now`. Inject one for deterministic tests. */
  readonly now?: () => number

  /** Parent supervisor to escalate to when this one gives up. */
  readonly supervisor?: Supervisor

  /** Observability hook invoked for every child failure before a decision is made. */
  readonly onFailure?: (child: Supervised, error: unknown, message: unknown) => void

}
