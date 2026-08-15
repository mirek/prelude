const timeout =
  <T, U>(wait: number, f: () => Promise<T>, g: () => U): Promise<T | U> =>
    new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        try {
          resolve(g())
        } catch (err: unknown) {
          reject(err)
        }
      }, wait)
      let pending: Promise<T>
      try {
        pending = f()
      } catch (err: unknown) {
        // A synchronous throw must not leave the timer running (g would still fire later).
        clearTimeout(id)
        reject(err)
        return
      }
      pending
        .finally(() => clearTimeout(id))
        .then(resolve)
        .catch(reject)
    })

export default timeout
