import { inspect } from 'util'

export type Assert<T> =
  (value: unknown) => T

export type Asserted<A> =
  A extends Assert<infer T> ?
    T :
    never

export type Primitive =
  | undefined
  | null
  | false
  | true
  | number
  | bigint
  | string
  | symbol
  | RegExp

export type Lifted<T> =
  T extends Assert<infer U> ?
    U :
    T extends Primitive ?
      T :
      never

export type IntersectionOfUnion<T> =
  (T extends unknown ? (_: T) => unknown : never) extends (_: infer R) => unknown ?
    R :
    never

export type Constructor = abstract new (...args: any) => any

export type Key = string | number | symbol

export type AssertionErrorInit = {
  expected: string,
  received: unknown,
  key?: Key,
  cause?: AssertionError
}

export class AssertionError extends Error {

  readonly expected: string
  readonly received: unknown
  readonly key?: Key
  override readonly cause?: AssertionError

  constructor(init: AssertionErrorInit) {
    super()
    this.name = 'AssertionError'
    this.expected = init.expected
    this.received = init.received
    if (init.key !== undefined) {
      this.key = init.key
    }
    if (init.cause !== undefined) {
      this.cause = init.cause
    }
    this.message = buildMessage(this)
  }

}

const formatKey =
  (k: Key): string =>
    typeof k === 'symbol' ?
      `.${k.toString()}` :
      `.${String(k)}`

/** Walks cause chain, collects keys, uses innermost `expected`/`received`. */
const buildMessage =
  (err: AssertionError): string => {
    let path = ''
    let leaf: AssertionError = err
    if (err.key !== undefined) {
      path += formatKey(err.key)
    }
    while (leaf.cause) {
      leaf = leaf.cause
      if (leaf.key !== undefined) {
        path += formatKey(leaf.key)
      }
    }
    return path ?
      `Expected ${path} to be ${leaf.expected}, got ${inspect(leaf.received)}.` :
      `Expected ${leaf.expected}, got ${inspect(leaf.received)}.`
  }

/** Throws an `AssertionError`. */
export const fail =
  (expected: string, received: unknown): never => {
    throw new AssertionError({ expected, received })
  }

/** Wraps an `AssertionError` with a container `key` and re-throws. Non-assertion errors pass through. */
export const wrap =
  (err: unknown, key: Key): never => {
    if (err instanceof AssertionError) {
      throw new AssertionError({
        expected: err.expected,
        received: err.received,
        key,
        cause: err
      })
    }
    throw err
  }
