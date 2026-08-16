import { inspect } from 'util'
import * as V from '@prelude/validation'

export type Ok<T> = {
  status: 'ok',
  value: T,
}

export type Fail = {
  status: 'refuted',
  reason: string,
  received: unknown
}

export type Result<T> =
  | Ok<T>
  | Fail

export type Refute<T> =
  (value: unknown) =>
    Result<T>

export type Refuted<P> =
  P extends Refute<infer U> ?
    U :
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
  T extends Refute<infer U> ?
    U :
    T extends Primitive ?
      T :
      never

export type IntersectionOfUnion<T> =
  (T extends unknown ? (_: T) => unknown : never) extends (_: infer R) => unknown ? R : never

export type Constructor = abstract new (...args: any) => any

export const parameter0 = '@prelude/refute:parameter0'

/** @returns success result. */
export const ok =
  <T>(value: T): Ok<T> =>
    ({ status: 'ok' as const, value })

/** @returns failure result. */
export const fail =
  (received: unknown, reason: string): Fail =>
    ({ status: 'refuted' as const, received, reason })

/** @returns `true` if provided `result` is failure, `false` otherwise. */
export const failed =
  (result: Result<unknown>): result is Fail =>
    result.status === 'refuted'

/** Wraps failure with provided `reason` prefix. */
export const refail =
  (failure: Fail, reason: string): Fail =>
    fail(failure.received, `${reason}, ${failure.reason}`)

export const nest =
  <T>(reason: string) =>
    (a: Refute<T>): Refute<T> =>
      (value: unknown) => {
        const r = a(value)
        return failed(r) ?
          refail(r, reason) :
          r
      }

/** @return failure reason without inspecting received value. */
export const reasonWithoutReceived =
  (failure: Fail): string =>
    `Invalid value ${failure.reason}.`

/** @return failure reason with inspecting received value. */
export const reasonWithReceived =
  (failure: Fail): string =>
    `Invalid value ${failure.reason}, got ${inspect(failure.received)}.`

// -- bridge to the shared core (@prelude/validation) --------------------------

const segmentReason =
  (segment: V.Segment): string => {
    switch (segment.kind) {
      case 'key': return `at key ${String(segment.key)}`
      case 'index': return `at index ${segment.index}`
      case 'keyOf': return 'key'
      case 'or': return segment.alternative === 'null' ? 'was not null' : segment.alternative === 'undefined' ? 'was defined' : 'was not nullish'
    }
  }

/** Renders what a core failure expected in this package's words (without the path). */
export const expectedReason =
  (expected: V.Expected, index?: number): string => {
    switch (expected.kind) {
      case 'type': return `expected ${expected.name}`
      case 'literal':
      case 'is': return `expected ${String(expected.value)}`
      case 'defined': return 'expected defined'
      case 'nullish': return 'expected nullish'
      case 'finite': return 'expected finite number'
      case 'safeInteger': return 'expected safe integer'
      case 'positive': return 'expected positive number'
      case 'compare': return `expected ${{ gt: 'greater than', gte: 'greater than or equal to', lt: 'less than', lte: 'less than or equal to' }[expected.operator]} ${expected.than}`
      case 'between': return `expected number between ${expected.min} and ${expected.max}`
      case 'oneOf': return `none of ${expected.values.map(String).join(', ')} matched`
      case 'regexp': return `expected to match ${expected.regexp}.`
      case 'instance': return `not an instance of ${expected.constructor.name}`
      case 'maxLength': return `expected array not longer than ${expected.length}`
      case 'extraKeys': return expected.partial ?
        `unexpected key ${expected.keys[0]}` :
        `has unexpected extra ${expected.keys.length === 1 ? 'key' : 'keys'} ${expected.keys.join(', ')}`
      case 'unique': return `duplicate value at index ${index}`
      case 'union': return `where none of ${expected.failures.length} alternatives matched`
      case 'strftime': return `expected ${expected.format} strftime, failed at index ${expected.index}`
      case 'calendarDate': return expected.problem === 'format' ? 'expected YYYY-MM-DD string' : 'expected valid date'
      case 'nonBlank': return 'expected non-blank string'
      case 'predicate': return 'expected value matching predicate'
      case 'text': return expected.text
    }
  }

/** Turns a core failure into this package's `Fail`. */
export const toFail =
  (failure: V.Failure): Fail => {
    let path = failure.path
    let index: undefined | number
    if (failure.expected.kind === 'unique') {
      // The duplicate's index is part of the wording, not a nesting step.
      const last = path[path.length - 1]
      index = last?.kind === 'index' ? last.index : undefined
      path = path.slice(0, -1)
    }
    const received = failure.expected.kind === 'strftime' ?
      { value: failure.received, index: failure.expected.index } :
      failure.received
    return fail(received, [ ...path.map(segmentReason), expectedReason(failure.expected, index) ].join(', '))
  }

/** The core validator behind a refute (or a primitive): built-ins carry theirs, custom refutes are adapted. */
export const toValidator =
  (a: Primitive | Refute<unknown>): V.Validator<unknown> => {
    if (typeof a !== 'function') {
      return V.lift(a)
    }
    return V.unwrap(a) ?? (value => {
      const result = a(value)
      return failed(result) ?
        { ok: false, path: [], expected: { kind: 'text', text: result.reason }, received: result.received } :
        V.ok(result.value)
    })
  }

/** A refute over a core validator. */
export const refuting =
  <T>(validator: V.Validator<T>): Refute<T> =>
    V.wrapped((value: unknown): Result<T> => {
      const outcome = validator(value)
      return outcome.ok ?
        ok(outcome.value) :
        toFail(outcome)
    }, validator)
