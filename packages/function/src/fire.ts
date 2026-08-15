import noop from './noop.js'

/** Runs `f` without awaiting it; failures (including a synchronous throw) go to `rejected`. */
const fire =
  (f: () => Promise<unknown>, rejected: (err: unknown) => void = noop): void => {
    let pending: Promise<unknown>
    try {
      pending = f()
    } catch (err: unknown) {
      rejected(err)
      return
    }
    pending.catch(rejected)
  }

export default fire
