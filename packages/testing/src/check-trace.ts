import { Prng } from './prng.js'
import { stressFactor } from './stress.js'

export type TraceOptions<Op> = {
  /** Base seed. Each trial derives its own generator from it, so a failure names `seed` and `trial`. */
  seed: number
  /** Number of traces to generate; multiplied by {@link stressFactor} unless `fixed` is set. */
  trials: number
  /** Do not scale `trials` with `SLOW_TESTS`. */
  fixed?: boolean
  /** Number of operations per trace, or a function choosing it per trial. */
  length: number | ((rng: Prng) => number)
  /**
   * Generates the next operation. `ops` are the operations generated so far
   * in this trace. Operations must stay meaningful as any subsequence of the
   * trace: shrinking replays subsets of them.
   */
  op: (rng: Prng, ops: readonly Op[]) => Op
  /**
   * Replays a trace from a fresh state — structure and reference model — and
   * throws at the first violated invariant or model disagreement.
   */
  run: (ops: readonly Op[]) => void | Promise<void>
  /** Optional simpler candidates for a single operation, tried during shrinking. */
  simplify?: (op: Op) => Op[]
}

export class TraceError extends Error {
  constructor(
    readonly seed: number,
    readonly trial: number,
    readonly ops: readonly unknown[],
    readonly originalLength: number,
    override readonly cause: unknown
  ) {
    super(
      `Trace check failed (seed ${seed}, trial ${trial}, ${originalLength} ops, shrunk to ${ops.length}):\n` +
      `${JSON.stringify(ops)}\n` +
      `Cause: ${cause instanceof Error ? cause.message : String(cause)}`
    )
    this.name = 'TraceError'
  }
}

const failure =
  async <Op>(run: TraceOptions<Op>['run'], ops: readonly Op[]): Promise<undefined | { error: unknown }> => {
    try {
      await run(ops)
      return undefined
    } catch (error) {
      return { error }
    }
  }

/**
 * Shrinks a failing trace to a locally minimal one: repeatedly removes chunks
 * of operations (halving the chunk size down to one), then tries the
 * `simplify` candidates for each remaining operation, as long as `run` still
 * throws. Returns the minimal trace and the error it produces.
 */
export const shrink =
  async <Op>(
    run: TraceOptions<Op>['run'],
    ops: readonly Op[],
    error: unknown,
    simplify?: (op: Op) => Op[]
  ): Promise<{ ops: readonly Op[], error: unknown }> => {
    let current = ops
    let currentError = error
    let chunk = Math.max(1, Math.floor(current.length / 2))
    while (chunk >= 1) {
      let removed = false
      for (let start = 0; start + chunk <= current.length; ) {
        const candidate = [ ...current.slice(0, start), ...current.slice(start + chunk) ]
        const result = await failure(run, candidate)
        if (result) {
          current = candidate
          currentError = result.error
          removed = true
        } else {
          start += chunk
        }
      }
      if (!removed) {
        chunk = Math.floor(chunk / 2)
      }
    }
    if (simplify) {
      let progress = true
      while (progress) {
        progress = false
        for (let i = 0; i < current.length; i++) {
          for (const simpler of simplify(current[i])) {
            const candidate = [ ...current.slice(0, i), simpler, ...current.slice(i + 1) ]
            const result = await failure(run, candidate)
            if (result) {
              current = candidate
              currentError = result.error
              progress = true
              break
            }
          }
        }
      }
    }
    return { ops: current, error: currentError }
  }

/**
 * Generates `trials` operation traces from `seed`, replays each through `run`
 * and, on the first failure, shrinks the trace and throws a {@link TraceError}
 * naming the seed, the trial and the minimal operation sequence.
 */
export const checkTrace =
  async <Op>(options: TraceOptions<Op>): Promise<void> => {
    const { seed, op, run, simplify } = options
    const trials = options.fixed ? options.trials : Math.ceil(options.trials * stressFactor())
    const base = new Prng(seed)
    for (let trial = 0; trial < trials; trial++) {
      const rng = base.derive(trial)
      const length = typeof options.length === 'number' ? options.length : options.length(rng)
      const ops: Op[] = []
      for (let i = 0; i < length; i++) {
        ops.push(op(rng, ops))
      }
      const result = await failure(run, ops)
      if (result) {
        const minimal = await shrink(run, ops, result.error, simplify)
        throw new TraceError(seed, trial, minimal.ops, ops.length, minimal.error)
      }
    }
  }
