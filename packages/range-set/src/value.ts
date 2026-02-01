/**
 * Defines operations for range values.
 *
 * @template T - The type of values
 */
export type Value<T> = {
  /** Merges two values when ranges overlap or are adjacent */
  merge: (a: T, b: T) => T
  /** Checks if two values are equal */
  eq: (a: T, b: T) => boolean
}

export type { Value as T }

/**
 * Value operations that sum numeric values when merging ranges.
 */
export const sum: Value<number> = {
  merge: (a, b) => a + b,
  eq: (a, b) => a === b
}

/**
 * Value operations that take the maximum of numeric values when merging ranges.
 */
export const max: Value<number> = {
  merge: (a, b) => Math.max(a, b),
  eq: (a, b) => a === b
}

/**
 * Value operations that take the minimum of numeric values when merging ranges.
 */
export const min: Value<number> = {
  merge: (a, b) => Math.min(a, b),
  eq: (a, b) => a === b
}

/**
 * Value operations that always take the right (second) value when merging ranges.
 */
export const right: Value<unknown> = {
  merge: (_a, b) => b,
  eq: (a, b) => a === b
}

/**
 * Value operations that always take the left (first) value when merging ranges.
 */
export const left: Value<unknown> = {
  merge: (a, _b) => a,
  eq: (a, b) => a === b
}

/**
 * Value operations on null values.
 */
const null_: Value<null> = {
  merge: (_a, _b) => null,
  eq: (_a, _b) => true
}

export { null_ as null }
