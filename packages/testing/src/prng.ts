/**
 * Deterministic pseudo-random numbers (splitmix32). Every test that needs
 * randomness derives it from an explicit seed so a failure can be replayed.
 */
export class Prng {
  #state: number

  constructor(readonly seed: number) {
    this.#state = seed >>> 0
  }

  /** @returns next 32-bit unsigned integer. */
  next(): number {
    let z = (this.#state = (this.#state + 0x9e3779b9) >>> 0)
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0
    return (z ^ (z >>> 15)) >>> 0
  }

  /** @returns float in [0, 1). */
  float(): number {
    return this.next() / 0x1_0000_0000
  }

  /** @returns integer in [0, n). */
  int(n: number): number {
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new RangeError(`Expected positive integer bound, got ${n}.`)
    }
    return Math.floor(this.float() * n)
  }

  /** @returns integer in [min, max], both inclusive. */
  between(min: number, max: number): number {
    return min + this.int(max - min + 1)
  }

  /** @returns `true` with probability `p`. */
  bool(p = 0.5): boolean {
    return this.float() < p
  }

  /** @returns a random element of a non-empty array. */
  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new RangeError('Expected a non-empty array to pick from.')
    }
    return values[this.int(values.length)]
  }

  /** @returns a new array with the elements of `values` in random order. */
  shuffled<T>(values: readonly T[]): T[] {
    const result = values.slice()
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /** @returns a random string of [minLength, maxLength] code points drawn from `alphabet` (astral characters stay whole). */
  string(alphabet: string, minLength: number, maxLength: number): string {
    const characters = Array.from(alphabet)
    const length = this.between(minLength, maxLength)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters[this.int(characters.length)]
    }
    return result
  }

  /** @returns an independent generator seeded from this one and `index` (used per trial). */
  derive(index: number): Prng {
    const child = new Prng((this.seed ^ Math.imul(index + 1, 0x85ebca6b)) >>> 0)
    child.next()
    return child
  }
}

/** @returns a generator for `seed`. */
export const prng =
  (seed: number): Prng =>
    new Prng(seed)
