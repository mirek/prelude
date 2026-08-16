import * as V from '@prelude/validation'
import type Predicate from './predicate.js'

/** The core validator behind a predicate: built-ins carry theirs, custom predicates are adapted. */
export const toValidator =
  <T>(p: Predicate<T>): V.Validator<T> =>
    (V.unwrap(p) as undefined | V.Validator<T>) ?? (value =>
      p(value) ?
        V.ok(value) :
        V.fail(value, { kind: 'predicate' }))

/** A predicate over a core validator: `true` when it accepts. */
export const predicating =
  <T>(validator: V.Validator<T>): Predicate<T> =>
    V.wrapped((value: unknown): value is T => validator(value).ok, validator)
