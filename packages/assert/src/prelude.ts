import { inspect } from 'util'
import * as V from '@prelude/validation'

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
  value: unknown,
  key?: Key,
  cause?: AssertionError
}

export class AssertionError extends Error {

  readonly expected: string
  readonly value: unknown
  readonly key?: Key
  override readonly cause?: AssertionError

  constructor(init: AssertionErrorInit) {
    super()
    this.name = 'AssertionError'
    this.expected = init.expected
    this.value = init.value
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

/** Walks cause chain, collects keys, uses innermost `expected`/`value`. */
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
      `Expected ${path} to be ${leaf.expected}, got ${inspect(leaf.value)}.` :
      `Expected ${leaf.expected}, got ${inspect(leaf.value)}.`
  }

/** Throws an `AssertionError`. */
export const fail =
  (expected: string, value: unknown): never => {
    throw new AssertionError({ expected, value })
  }

/** Wraps an `AssertionError` with a container `key` and re-throws. Non-assertion errors pass through. */
export const wrap =
  (err: unknown, key: Key): never => {
    if (err instanceof AssertionError) {
      throw new AssertionError({
        expected: err.expected,
        value: err.value,
        key,
        cause: err
      })
    }
    throw err
  }

// -- bridge to the shared core (@prelude/validation) --------------------------

const article =
  (name: string) =>
    /^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`

/** Renders what a core failure expected in this package's words (the leaf phrase, without path). */
export const phrase =
  (failure: V.Failure): string => {
    const { expected } = failure
    let text: string
    switch (expected.kind) {
      case 'type':
        text = expected.name === 'undefined' || expected.name === 'null' ? expected.name : article(expected.name)
        break
      case 'literal':
      case 'is':
        text = inspect(expected.value)
        break
      case 'defined': text = 'defined'; break
      case 'nullish': text = 'null or undefined'; break
      case 'finite': text = 'a finite number'; break
      case 'safeInteger': text = 'a safe integer'; break
      case 'positive': text = 'a positive number'; break
      case 'compare':
        text = `a number ${{ gt: 'greater than', gte: 'greater than or equal to', lt: 'less than', lte: 'less than or equal to' }[expected.operator]} ${expected.than}`
        break
      case 'between': text = `a number between ${expected.min} and ${expected.max}`; break
      case 'oneOf': text = `one of ${expected.values.map(_ => inspect(_)).join(', ')}`; break
      case 'regexp': text = `a string matching ${expected.regexp}`; break
      case 'instance': text = `an instance of ${expected.constructor.name}`; break
      case 'maxLength': text = `an array not longer than ${expected.length}`; break
      case 'extraKeys': text = 'no extra keys'; break
      case 'unique': text = 'a unique value'; break
      case 'union': text = expected.failures.map(phrase).join(' or '); break
      case 'strftime': text = `a string in the ${expected.format} strftime format`; break
      case 'calendarDate': text = expected.problem === 'format' ? 'a YYYY-MM-DD string' : 'a valid calendar date'; break
      case 'nonBlank': text = 'a non-blank string'; break
      case 'predicate': text = 'a value satisfying the predicate'; break
      case 'text': text = expected.text; break
    }
    // "x or null" only describes a top-level failure; a nested one keeps its own description.
    if (!failure.path.some(segment => segment.kind === 'key' || segment.kind === 'index' || segment.kind === 'keyOf')) {
      for (let i = failure.path.length - 1; i >= 0; i--) {
        const segment = failure.path[i]
        if (segment.kind === 'or') {
          text += ` or ${segment.alternative}`
        }
      }
    }
    return text
  }

/** Turns a core failure into the AssertionError chain this package throws. */
export const toError =
  (failure: V.Failure): AssertionError => {
    const keys: Key[] = failure.path.flatMap((segment): Key[] =>
      segment.kind === 'key' || segment.kind === 'keyOf' ? [ segment.key ] : segment.kind === 'index' ? [ segment.index ] : [])
    if (failure.expected.kind === 'extraKeys') {
      keys.push(failure.expected.keys[0])
    }
    let error = new AssertionError({ expected: phrase(failure), value: failure.received })
    for (let i = keys.length - 1; i >= 0; i--) {
      error = new AssertionError({ expected: error.expected, value: error.value, key: keys[i], cause: error })
    }
    return error
  }

/** A core failure equivalent to a thrown AssertionError (path from its key chain, its phrase kept as is). */
export const toFailure =
  (error: AssertionError): V.Failure => {
    const path: V.Segment[] = []
    let leaf: AssertionError = error
    while (true) {
      if (leaf.key !== undefined) {
        path.push(typeof leaf.key === 'number' ? { kind: 'index', index: leaf.key } : { kind: 'key', key: leaf.key })
      }
      if (!leaf.cause) {
        break
      }
      leaf = leaf.cause
    }
    return { ok: false, path, expected: { kind: 'text', text: leaf.expected }, received: leaf.value }
  }

/** The core validator behind an assert (or a primitive): built-ins carry theirs, custom asserts are adapted. */
export const toValidator =
  (a: Primitive | Assert<unknown>): V.Validator<unknown> => {
    if (typeof a !== 'function') {
      return V.lift(a)
    }
    return V.unwrap(a) ?? (value => {
      try {
        return V.ok(a(value))
      } catch (err) {
        if (err instanceof AssertionError) {
          return toFailure(err)
        }
        throw err
      }
    })
  }

/** An assert over a core validator: throws the failure as an AssertionError, returns the value otherwise. */
export const asserting =
  <T>(validator: V.Validator<T>): Assert<T> =>
    V.wrapped((value: unknown): T => {
      const outcome = validator(value)
      if (!outcome.ok) {
        throw toError(outcome)
      }
      return outcome.value
    }, validator)
