/**
 * Renders a received value for an error message without Node's `util.inspect`,
 * so the package stays isomorphic. Strings are quoted, JSON-able values are
 * serialised, everything else falls back to `String`.
 */
export const inspect =
  (value: unknown): string => {
    if (typeof value === 'string') {
      return JSON.stringify(value)
    }
    if (typeof value === 'bigint') {
      return `${value}n`
    }
    if (typeof value !== 'object' || value === null) {
      return String(value as symbol | number | boolean | null | undefined | ((...args: unknown[]) => unknown))
    }
    try {
      const json = JSON.stringify(value)
      if (json !== undefined) {
        return json
      }
    } catch {
      // Circular or otherwise unserialisable: fall through.
    }
    return Object.prototype.toString.call(value)
  }

export type Ok<T> = {
  status: 'ok',
  value: T,
}

export type Fail = {
  status: 'refuted',
  reason: string,
  received: unknown
}

export type Result<T = unknown> =
  | Ok<T>
  | Fail

export type Refute<T> =
  (value: unknown) =>
    Result<T>

export type t<T> =
  Refute<T>

/** @returns `true` if provided `result` is failure, `false` otherwise. */
export const failed =
  (result: Result): result is Fail =>
    result.status === 'refuted'

/** @return failure reason without inspecting received value. */
export const reasonWithoutReceived =
  (failure: Fail): string =>
    `Invalid value ${failure.reason}.`

/** @return failure reason with inspecting received value. */
export const reasonWithReceived =
  (failure: Fail): string =>
    `Invalid value ${failure.reason}, got ${inspect(failure.received)}.`
