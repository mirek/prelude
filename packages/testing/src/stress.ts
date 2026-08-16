/**
 * Multiplier for trial counts. The default suite runs a bounded, deterministic
 * number of trials; `SLOW_TESTS=<factor>` scales every `checkTrace` up for
 * the scheduled stress workflow or a local soak (a non-numeric value such as
 * `SLOW_TESTS=true` means 20).
 */
export const stressFactor =
  (): number => {
    const value = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SLOW_TESTS
    if (value === undefined || value === '') {
      return 1
    }
    const factor = Number(value)
    return Number.isFinite(factor) && factor > 0 ? factor : 20
  }
