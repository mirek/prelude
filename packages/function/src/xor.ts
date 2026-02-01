import type { Predicate } from './prelude.js'

/** @returns boolean logic exlusive-or from provided predicates. */
const xor =
  <A, B>(a: Predicate<A>, b: Predicate<B>) =>
    (value: A & B) =>
      a(value) ?
        b(value) ?
          false :
          true :
        b(value) ?
          true :
          false

export default xor
